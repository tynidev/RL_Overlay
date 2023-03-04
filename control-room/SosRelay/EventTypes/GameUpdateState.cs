﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SOS.EventTypes
{
    public class GameUpdateState
    {
        public string @event { get; set; } = string.Empty;
        public Game game { get; set; } = new Game();
        public bool hasGame { get; set; } = false;
        public string match_guid { get; set; } = string.Empty;
        public Dictionary<string, Player> players { get; set; } = new Dictionary<string, Player>();
    }
}
