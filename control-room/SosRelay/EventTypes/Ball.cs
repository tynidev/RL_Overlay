using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public class BallLocation : Location
    {
        public double X { get; set; } = 0;
        public double Y { get; set; } = 0;
        public double Z { get; set; } = 0;
    }
    public class Ball
    {
        public BallLocation location { get; set; } = new BallLocation();
        public int speed { get; set; } = 0;
        public int team { get; set; } = 0;
    }
}
