using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BakkesMod
{
    public class Config
    {
        private static readonly string _FILE_PATH = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "bakkesmod/bakkesmod/cfg/config.cfg");

        private static Config _instance = new Config();

        private Dictionary<string, string> _settings = new Dictionary<string, string>();

        private Config()
        {
            foreach (string line in System.IO.File.ReadLines(_FILE_PATH))
            {
                var pieces = line.Split(" ");
                if (pieces.Length < 2)
                    return;

                var name = pieces[0].Trim();
                var value = pieces[1].Trim(new char[] { ' ', '"' });

                _settings.Add(name, value);
            }
        }

        public static Config Settings
        {
            get
            {
                if (_instance == null)
                {
                    _instance = new Config();
                }
                return _instance;
            }
        }

        public bool Has(string name)
        {
            ArgumentNullException.ThrowIfNull(name);
            return _settings.ContainsKey(name);
        }

        public string Get(string name)
        {
            ArgumentNullException.ThrowIfNull(name);
            if (!Has(name))
                return string.Empty;
            return _settings[name];
        }
    }
}
