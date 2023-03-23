interface target{
  id:string,
  name:string,
  team_num:number
}

export interface StatFeed {
  stat: StatfeedEvent,
  ttl: number
}

export interface StatfeedEvent {
  match_guid:string,
  main_target:target,
  secondary_target:target,
  type:string,
}
