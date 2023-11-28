export const enum ChatInstanceFlags {
	Clan                   = (0x000FFFFF + 1) >> 1,
	Lobby                  = (0x000FFFFF + 1) >> 2,
	MatchMakingServerLobby = (0x000FFFFF + 1) >> 3,
}
