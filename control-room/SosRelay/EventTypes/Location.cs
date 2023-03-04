using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public interface Location
    {
        double X { get; set; }
        double Y { get; set; }
        double Z { get; set; }
    }
}
