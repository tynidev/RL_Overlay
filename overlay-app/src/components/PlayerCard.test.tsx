import { ArePlayerCardPropsEqual } from './PlayerCard';
import { NewPlayer } from '../types/player';
import { StatFeed, StatfeedEvent } from '../types/statfeedEvent';
import { PlayerCardProps } from './PlayerCard'; // Assuming PlayerCardProps is exported or defined here

// Helper function to create a mock StatFeed object
const createMockStatFeed = (type: string, mainTargetId: string, secondaryTargetId?: string, ttl = 5): StatFeed => ({
  stat: {
    match_guid: 'mock-guid',
    main_target: { id: mainTargetId, name: `Player_${mainTargetId}`, team_num: 0 },
    secondary_target: secondaryTargetId ? { id: secondaryTargetId, name: `Player_${secondaryTargetId}`, team_num: 1 } : undefined,
    type: type,
  } as StatfeedEvent,
  ttl: ttl,
});

// Helper function to create mock PlayerCardProps
const createMockProps = (overrides: Partial<PlayerCardProps> = {}): PlayerCardProps => {
  const defaultPlayer = NewPlayer();
  defaultPlayer.id = 'player1';
  defaultPlayer.name = 'Test Player';
  defaultPlayer.boost = 50;

  return {
    player: defaultPlayer,
    spectating: false,
    index: 0,
    showBoost: true,
    statfeed: [],
    ...overrides,
  };
};

describe('ArePlayerCardPropsEqual', () => {
  test('should return true for identical props', () => {
    const props1 = createMockProps();
    const props2 = createMockProps();
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(true);
  });

  test('should return true for identical props with non-empty statfeed', () => {
    const statfeed = [createMockStatFeed('Goal', 'player1')];
    const props1 = createMockProps({ statfeed });
    const props2 = createMockProps({ statfeed });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(true);
  });

  test('should return false if index is different', () => {
    const props1 = createMockProps({ index: 0 });
    const props2 = createMockProps({ index: 1 });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if showBoost is different', () => {
    const props1 = createMockProps({ showBoost: true });
    const props2 = createMockProps({ showBoost: false });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if spectating is different', () => {
    const props1 = createMockProps({ spectating: true });
    const props2 = createMockProps({ spectating: false });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if player.id is different', () => {
    const player1 = { ...NewPlayer(), id: 'player1', name: 'Test', boost: 50 };
    const player2 = { ...NewPlayer(), id: 'player2', name: 'Test', boost: 50 };
    const props1 = createMockProps({ player: player1 });
    const props2 = createMockProps({ player: player2 });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if player.name is different', () => {
    const player1 = { ...NewPlayer(), id: 'player1', name: 'Test1', boost: 50 };
    const player2 = { ...NewPlayer(), id: 'player1', name: 'Test2', boost: 50 };
    const props1 = createMockProps({ player: player1 });
    const props2 = createMockProps({ player: player2 });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if player.boost is different', () => {
    const player1 = { ...NewPlayer(), id: 'player1', name: 'Test', boost: 50 };
    const player2 = { ...NewPlayer(), id: 'player1', name: 'Test', boost: 60 };
    const props1 = createMockProps({ player: player1 });
    const props2 = createMockProps({ player: player2 });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if statfeed arrays have different lengths', () => {
    const props1 = createMockProps({ statfeed: [createMockStatFeed('Goal', 'p1')] });
    const props2 = createMockProps({ statfeed: [] });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if statfeed arrays have different stat types', () => {
    const props1 = createMockProps({ statfeed: [createMockStatFeed('Goal', 'p1')] });
    const props2 = createMockProps({ statfeed: [createMockStatFeed('Save', 'p1')] });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if statfeed arrays have different main_target ids', () => {
    const props1 = createMockProps({ statfeed: [createMockStatFeed('Goal', 'p1')] });
    const props2 = createMockProps({ statfeed: [createMockStatFeed('Goal', 'p2')] });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return false if statfeed arrays have different secondary_target ids', () => {
    const props1 = createMockProps({ statfeed: [createMockStatFeed('Assist', 'p1', 'p2')] });
    const props2 = createMockProps({ statfeed: [createMockStatFeed('Assist', 'p1', 'p3')] });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return true if statfeed arrays have same secondary_target ids (undefined)', () => {
    const props1 = createMockProps({ statfeed: [createMockStatFeed('Assist', 'p1', 'p2')] });
    const props2 = createMockProps({ statfeed: [createMockStatFeed('Assist', 'p1', 'p2')] });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(true);
  });

   test('should return false if one statfeed has secondary_target and the other does not', () => {
    const props1 = createMockProps({ statfeed: [createMockStatFeed('Assist', 'p1', 'p2')] });
    const props2 = createMockProps({ statfeed: [createMockStatFeed('Assist', 'p1')] }); // No secondary target
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });

  test('should return true for complex identical statfeed arrays', () => {
    const statfeed = [
      createMockStatFeed('Goal', 'p1'),
      createMockStatFeed('Assist', 'p2', 'p1'),
    ];
    const props1 = createMockProps({ statfeed });
    const props2 = createMockProps({ statfeed: [...statfeed] }); // Ensure a new array instance with same content
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(true);
  });

  test('should return false for complex different statfeed arrays', () => {
    const statfeed1 = [
      createMockStatFeed('Goal', 'p1'),
      createMockStatFeed('Assist', 'p2', 'p1'),
    ];
    const statfeed2 = [
      createMockStatFeed('Goal', 'p1'),
      createMockStatFeed('Save', 'p3'), // Different stat type and target
    ];
    const props1 = createMockProps({ statfeed: statfeed1 });
    const props2 = createMockProps({ statfeed: statfeed2 });
    expect(ArePlayerCardPropsEqual(props1, props2)).toBe(false);
  });
});
