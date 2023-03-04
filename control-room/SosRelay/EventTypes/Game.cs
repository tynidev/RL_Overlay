using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public class Game
    {
        public string arena { get; set; } = string.Empty;
        public Ball ball { get; set; } = new Ball();
        public bool hasTarget { get; set; } = false;
        public bool hasWinner { get; set; } = false;
        public bool isOT { get; set; } = false;
        public bool isReplay { get; set; } = false;
        public bool isSeries { get; set; } = false;
        public string localplayer { get; set; } = string.Empty;
        public int seriesLength { get; set; } = 0;
        public string target { get; set; } = string.Empty;
        public List<Team> teams { get; set; } = new List<Team>();
        public double time_milliseconds { get; set; } = 0.0;
        public int time_seconds { get; set; } = 0;
        public string winner { get; set; } = string.Empty;
    }
}
