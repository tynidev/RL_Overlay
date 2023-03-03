using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS
{
    public interface ILogger
    {
        void Info(string message);
        void Verbose(string message);
        void Error(string message);
    }
}
