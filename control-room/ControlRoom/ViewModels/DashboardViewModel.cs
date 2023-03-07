using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SOS;
using System;
using System.Threading;
using System.Timers;
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

        private DispatcherTimer changeTimer;

        public IRelay _relay { get; set; }
        
        public DashboardViewModel(IRelay relay) 
        { 
            this._relay = relay;
            changeTimer = new DispatcherTimer(DispatcherPriority.Background);
            changeTimer.Tick += this.Tick;
            changeTimer.Interval = TimeSpan.FromSeconds(1/2);
            changeTimer.Start();
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
        }
    }
}
