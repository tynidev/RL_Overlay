using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public class Team
    {
        public string color_primary { get; set; } = string.Empty;
        public string color_secondary { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public int score { get; set; } = 0;
    }
}
