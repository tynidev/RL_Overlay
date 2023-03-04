using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public interface Orientation
    {
        int pitch { get; set; }
        int roll { get; set; }
        int yaw { get; set; }
    }
}
