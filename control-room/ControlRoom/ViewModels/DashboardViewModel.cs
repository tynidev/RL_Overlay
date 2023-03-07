using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RConn;
using SOS;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Timers;
using System.Windows.Input;
using System.Windows.Threading;
using Wpf.Ui.Common.Interfaces;

namespace ControlRoom.ViewModels
{
    public partial class DashboardViewModel : ObservableObject, INavigationAware
    {
        [ObservableProperty]
        private int _sosRelayClientsConnected = 0;

        [ObservableProperty]
        private bool _sosRelayListening = false;

        [ObservableProperty]
        private bool _rlConnected = false;

        [ObservableProperty]
        private bool _rconnConnected = false;

        private DispatcherTimer changeTimer;

        private IRelay _relay { get; set; }

        private RemoteConnection _rConn { get; set; }
        
        public DashboardViewModel(IRelay relay, RemoteConnection rconn) 
        { 
            this._relay = relay;
            this._rConn = rconn;

            changeTimer = new DispatcherTimer(DispatcherPriority.Background);
            changeTimer.Tick += this.Tick;
            changeTimer.Interval = TimeSpan.FromSeconds(1/2);
            changeTimer.Start();
        }

        private ICommand _rconnHideUI;
        public ICommand RconnHideUI
        {
            get
            {
                if (_rconnHideUI == null)
                    _rconnHideUI = new RConnHideUI(this._rConn);
                return _rconnHideUI;
            }
            set
            {
                _rconnHideUI = value;
            }
        }

        public void OnNavigatedTo()
        {
            SosRelayClientsConnected = _relay.ConnectedClients();
        }

        public void OnNavigatedFrom()
        {
        }

        private void Tick(object? sender, EventArgs e)
        {
            this.SosRelayClientsConnected = _relay.ConnectedClients();
            this.SosRelayListening = _relay.IsListening();
            this.RlConnected = _relay.IsRlConnected();
            this.RconnConnected = this._rConn.socket.State == System.Net.WebSockets.WebSocketState.Open;
        }
    }

    class RConnHideUI : ICommand
    {
        private bool _canExecute = true;
        private RemoteConnection _rConn;
        public RConnHideUI(RemoteConnection rconn)
        {
            this._rConn = rconn;
        }

        #region ICommand Members  

        public bool CanExecute(object parameter)
        {
            return _canExecute && this._rConn.socket.State == System.Net.WebSockets.WebSocketState.Open;
        }
        public event EventHandler CanExecuteChanged
        {
            add { CommandManager.RequerySuggested += value; }
            remove { CommandManager.RequerySuggested -= value; }
        }

        public void Execute(object parameter)
        {
            ExecuteAsync();
        }

        private async Task ExecuteAsync()
        {
            this._canExecute = false;
            await this._rConn.SendCommandAsync("replay_gui hud 1");
            await this._rConn.SendCommandAsync("replay_gui matchinfo 1");
            await Task.Delay(TimeSpan.FromMilliseconds(1));
            await this._rConn.SendCommandAsync("replay_gui hud 0");
            await this._rConn.SendCommandAsync("replay_gui matchinfo 0");
            this._canExecute = true;
        }
        #endregion
    }
}
