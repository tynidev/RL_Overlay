using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SOS;
using Wpf.Ui.Common.Interfaces;

namespace ControlRoom.ViewModels
{
    public partial class DashboardViewModel : ObservableObject, INavigationAware
    {
        public IRelay _relay { get; set; }
        public DashboardViewModel(IRelay relay) 
        { 
            this._relay = relay;
        }

        [ObservableProperty]
        private int _counter = 0;

        public void OnNavigatedTo()
        {
            Counter = _relay.IsListening() ? 1 : 0;
        }

        public void OnNavigatedFrom()
        {
        }
    }
}
