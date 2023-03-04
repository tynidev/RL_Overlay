using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public class CarLocation : Location, Orientation
    {
        public double X { get; set; } = 0;
        public double Y { get; set; } = 0;
        public double Z { get; set; } = 0;
        public int pitch { get; set; } = 0;
        public int roll { get; set; } = 0;
        public int yaw { get; set; } = 0;
    }

    public class Player
    {
        public int assists { get; set; } = 0;
        public string attacker { get; set; } = string.Empty;
        public int boost { get; set; } = 0;
        public int cartouches { get; set; } = 0;
        public int demos { get; set; } = 0;
        public int goals { get; set; } = 0;
        public bool hasCar { get; set; } = false;
        public string id { get; set; } = string.Empty;
        public bool isDead { get; set; } = false;
        public bool isPowersliding { get; set; } = false;
        public bool isSonic { get; set; } = false;
        public CarLocation location { get; set; } = new CarLocation();
        public string name { get; set; } = string.Empty;
        public bool onGround { get; set; } = false;
        public bool onWall { get; set; } = false;
        public string primaryID { get; set; } = string.Empty;
        public int saves { get; set; } = 0;
        public int score { get; set; } = 0;
        public int shortcut { get; set; } = 0;
        public int shots { get; set; } = 0;
        public int speed { get; set; } = 0;
        public int team { get; set; } = 0;
        public int touches { get; set; } = 0;
    }
}
