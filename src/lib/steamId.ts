import { Format } from './Format';
import { Instance } from './Instance';
import { Universe } from './Universe';
import { steamAccountHash } from './md5';
import { Type, TypeCharacter } from './Type';
import { ChatInstanceFlags } from './ChatInstanceFlags';

const MAX_ACCOUNT_ID = 0xFFFFFFFF;
const MAX_INSTANCE = 0x000FFFFF;
const MAX_STEAM_ID64 = (1n << 64n) - 1n;
const ACCOUNT_ID_MASK = 0xFFFFFFFFn;
const INSTANCE_MASK = 0xFFFFFn;
const TYPE_MASK = 0xFn;

const ID2_PATTERN = /^STEAM_([0-4]):([0-1]):(0|[1-9][0-9]{0,9})$/;
const ID3_PATTERN = /^(?:\[[AGMPCgcLTIUai]:[0-4]:(?:0|[1-9][0-9]{0,9})(?::[0-9]{1,7})?\]|[AGMPCgcLTIUai]:[0-4]:(?:0|[1-9][0-9]{0,9})(?::[0-9]{1,7})?)$/;
const ID3_COMPONENT_PATTERN = /^([AGMPCgcLTIUai]):([0-4]):(0|[1-9][0-9]{0,9})(?::([0-9]{1,7}))?$/;
const ID64_PATTERN = /^[1-9][0-9]{16,19}$/;
const FIVEM_PATTERN = /^steam:[a-f0-9]{15}$/;
const INVITE_PATTERN = /^(?:[bcdfghjkmnpqrtvw]{1,3}|[bcdfghjkmnpqrtvw]{2,4}-[bcdfghjkmnpqrtvw]{2,4})$/i;
const SHORT_URL_PATTERN = /^https?:\/\/(?:s\.team\/p|steamcommunity\.com\/user)\/([^/?#]+)\/?$/i;
const INVITE_ALPHABET = 'bcdfghjkmnpqrtvw';

function matchSteamId3(input: string): RegExpMatchArray | null {
	const opensWithBracket = input.startsWith('[');
	const closesWithBracket = input.endsWith(']');

	if (opensWithBracket !== closesWithBracket) {
		return null;
	}

	return ID3_COMPONENT_PATTERN.exec(opensWithBracket ? input.slice(1, -1) : input);
}

export class SteamId {
	public universe:  number;
	public type:      number;
	public instance:  number;
	public accountId: number;
	public format:    Format;

	public readonly id2Pattern:   RegExp;
	public readonly id3Pattern:   RegExp;
	public readonly id64Pattern:  RegExp;
	public readonly fiveMPattern: RegExp;
	public readonly invitePattern: RegExp;
	public readonly shortUrlPattern: RegExp;

	public constructor(input?: string) {
		this.universe  = Universe.Invalid;
		this.type      = Type.Invalid;
		this.instance  = Instance.All;
		this.accountId = 0;
		this.format    = Format.None;

		this.id2Pattern     = ID2_PATTERN;
		this.id3Pattern     = ID3_PATTERN;
		this.id64Pattern    = ID64_PATTERN;
		this.fiveMPattern   = FIVEM_PATTERN;
		this.invitePattern  = INVITE_PATTERN;
		this.shortUrlPattern = SHORT_URL_PATTERN;

		if (input === undefined) {
			return;
		}

		const firstCharacter = input.charCodeAt(0);
		const id2Match = firstCharacter === 83 ? ID2_PATTERN.exec(input) : null;
		const id3Match = !id2Match && (firstCharacter === 91 || input.charCodeAt(1) === 58) ? matchSteamId3(input) : null;
		const isFiveM = firstCharacter === 115 && input.startsWith('steam:');
		const isSteamId64 = !isFiveM && firstCharacter >= 49 && firstCharacter <= 57 && ID64_PATTERN.test(input);

		if (id2Match) {
			const matches = id2Match;
			const accountId = (parseInt(matches[3], 10) * 2) + parseInt(matches[2], 10);

			if (accountId > MAX_ACCOUNT_ID) {
				throw new Error('SteamID account ID exceeds the unsigned 32-bit range.');
			}

			this.format    = Format.SteamId;
			this.universe  = parseInt(matches[1], 10) || Universe.Public;
			this.type      = Type.Individual;
			this.instance  = Instance.Desktop;
			this.accountId = accountId;
		} else if (id3Match) {
			const matches   = id3Match;
			const character = matches[1];
			const accountId = parseInt(matches[3], 10);
			const instance  = matches[4] === undefined ? undefined : parseInt(matches[4], 10);

			if (accountId > MAX_ACCOUNT_ID) {
				throw new Error('SteamID account ID exceeds the unsigned 32-bit range.');
			}

			if (instance !== undefined && instance > MAX_INSTANCE) {
				throw new Error('SteamID instance exceeds the unsigned 20-bit range.');
			}

			this.format    = Format.SteamId3;
			this.universe  = parseInt(matches[2], 10);
			this.accountId = accountId;

			if (instance !== undefined) {
				this.instance = instance;
			} else if (character === 'U') {
				this.instance = Instance.Desktop;
			}

			if (character === 'c') {
				this.instance |= ChatInstanceFlags.Clan.valueOf();
				this.type     = Type.Chat;
			} else if (character === 'L') {
				this.instance |= ChatInstanceFlags.Lobby;
				this.type     = Type.Chat;
			} else {
				this.type = TypeCharacter[character as keyof typeof TypeCharacter] ?? Type.Invalid;
			}
		} else if (isSteamId64 || (isFiveM && FIVEM_PATTERN.test(input))) {
			let value: bigint;

			if (isFiveM) {
				value = BigInt(`0x${input.slice(6)}`);
				this.format = Format.FiveM;
			} else {
				value = BigInt(input);

				if (value > MAX_STEAM_ID64) {
					throw new Error('SteamID64 exceeds the unsigned 64-bit range.');
				}

				this.format = Format.SteamId64;
			}

			this.accountId = Number(value & ACCOUNT_ID_MASK);
			this.instance  = Number((value >> 32n) & INSTANCE_MASK);
			this.type      = Number((value >> 52n) & TYPE_MASK);
			this.universe  = Number(value >> 56n);
		} else {
			const shortUrlMatch = SHORT_URL_PATTERN.exec(input);
			const inviteCode = shortUrlMatch?.[1] ?? input;

			if (INVITE_PATTERN.test(inviteCode)) {
				const normalized = inviteCode.toLowerCase();
				const accountIdHex = normalized.replace('-', '').split('').map(character => INVITE_ALPHABET.indexOf(character).toString(16)).join('');
				const accountId = parseInt(accountIdHex, 16);

				if (accountId > 0 && this.encodeInviteCode(accountId) === normalized) {
					this.universe  = Universe.Public;
					this.type      = Type.Individual;
					this.instance  = Instance.Desktop;
					this.accountId = accountId;
					this.format    = shortUrlMatch ? Format.ShortUrl : Format.InviteCode;
				}
			}
		}

		if (!this.isValid()) {
			throw new Error('Invalid SteamID provided.');
		}
	}

	public isValid(): boolean {
		if (!Number.isInteger(this.accountId) || this.accountId < 0 || this.accountId > MAX_ACCOUNT_ID) {
			return false;
		}

		if (!Number.isInteger(this.instance) || this.instance < 0 || this.instance > MAX_INSTANCE) {
			return false;
		}

		if (!Number.isInteger(this.type) || this.type <= Type.Invalid || this.type > Type.AnonymousUser) {
			return false;
		}

		if (!Number.isInteger(this.universe) || this.universe <= Universe.Invalid || this.universe > Universe.Dev) {
			return false;
		}

		if (this.type === Type.Individual && (this.accountId === 0 || this.instance !== Instance.Desktop)) {
			return false;
		}

		if (this.type === Type.Clan && (this.accountId === 0 || this.instance !== Instance.All)) {
			return false;
		}

		if (this.type === Type.GameServer && this.accountId === 0) {
			return false;
		}

		return true;
	}

	public isGroupChat(): boolean {
		return this.type === Type.Chat && !!(this.instance & ChatInstanceFlags.Clan);
	}

	public isLobby(): boolean {
		return this.type === Type.Chat && !!(this.instance & ChatInstanceFlags.Lobby || this.instance & ChatInstanceFlags.MatchMakingServerLobby);
	}

	public toSteamId2(): string {
		if (this.type !== Type.Individual) {
			throw new Error('Only individual-type Steam IDs can be rendered to SteamID2.');
		}

		return `STEAM_${this.universe === 1 ? 0 : this.universe}:${this.accountId & 1}:${Math.floor(this.accountId / 2)}`;
	}

	public toSteamId3(withBrackets = true): string {
		let character = TypeCharacter[this.type];

		if (character === undefined) {
			throw new Error('This SteamID account type cannot be represented as SteamID3.');
		}

		const chatFlags = this.instance & ~0xFFF;

		if (chatFlags === ChatInstanceFlags.Clan) {
			character = 'c';
		} else if (chatFlags === ChatInstanceFlags.Lobby) {
			character = 'L';
		}

		const instance = this.type === Type.AnonymousGameServer || this.type === Type.Multiseat || (this.type === Type.Individual && this.instance !== Instance.Desktop);
		const id3 = `${character}:${this.universe}:${this.accountId}${(instance ? ':' + this.instance : '')}`;

		return withBrackets ? `[${id3}]` : id3;
	}

	public toSteamId64(hexadecimal = false): string {
		const value = BigInt(this.accountId) |
			(BigInt(this.instance) << 32n) |
			(BigInt(this.type) << 52n) |
			(BigInt(this.universe) << 56n);

		return value.toString(hexadecimal ? 16 : 10);
	}

	public toFiveM(): string {
		if (this.type !== Type.Individual) {
			throw new Error('Only individual-type SteamIDs can be rendered to FiveM identifiers.');
		}

		return `steam:${this.toSteamId64(true)}`;
	}

	public toInviteCode(): string {
		if (this.type !== Type.Individual) {
			throw new Error('Only individual-type SteamIDs can be rendered to invite codes.');
		}

		return this.encodeInviteCode(this.accountId);
	}

	private encodeInviteCode(accountId: number): string {
		const accountIdHex = accountId.toString(16);
		const inviteCode   = accountIdHex.split('').map(character => INVITE_ALPHABET[parseInt(character, 16)]).join('');

		if (inviteCode.length <= 3) {
			return inviteCode;
		}

		const middle = Math.floor(inviteCode.length / 2);

		return `${inviteCode.slice(0, middle)}-${inviteCode.slice(middle)}`;
	}

	public toShortUrl(): string {
		const inviteCode = this.toInviteCode();

		return `https://s.team/p/${inviteCode}`;
	}

	public toCsFriendCode(): string {
		if (this.type !== Type.Individual) {
			throw new Error('Only individual-type SteamIDs can be rendered to Counter-Strike friend codes.');
		}

		const hash = BigInt(steamAccountHash(this.accountId));
		let result = 0n;

		for (let index = 0n; index < 8n; index++) {
			const accountNibble = (BigInt(this.accountId) >> (4n * index)) & 0xFn;
			const hashBit = (hash >> index) & 1n;
			const value = (result << 4n) | accountNibble;

			result = ((result >> 28n) << 32n) | value;
			result = ((result >> 31n) << 32n) | (value << 1n) | hashBit;
		}

		let reversed = 0n;

		for (let index = 0; index < 8; index++) {
			reversed = (reversed << 8n) | (result & 0xFFn);
			result >>= 8n;
		}

		result = reversed;

		const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let friendCode = '';

		for (let index = 0; index < 13; index++) {
			if (index === 4 || index === 9) {
				friendCode += '-';
			}

			friendCode += alphabet[Number(result & 31n)];
			result >>= 5n;
		}

		return friendCode.slice(5);
	}

	public static fromAccountId(accountId: number): SteamId {
		if (!Number.isInteger(accountId) || accountId <= 0 || accountId > MAX_ACCOUNT_ID) {
			throw new RangeError('Account ID must be an unsigned 32-bit integer greater than zero.');
		}

		const inst = new this();

		inst.universe  = Universe.Public;
		inst.type      = Type.Individual;
		inst.instance  = Instance.Desktop;
		inst.accountId = accountId;
		inst.format    = Format.AccountId;

		return inst;
	}

	public static fromInviteCode(inviteCode: string): SteamId {
		const inst = new this(inviteCode);

		if (inst.format !== Format.InviteCode) {
			throw new Error('Invalid Steam invite code provided.');
		}

		return inst;
	}

	public static fromShortUrl(shortUrl: string): SteamId {
		const inst = new this(shortUrl);

		if (inst.format !== Format.ShortUrl) {
			throw new Error('Invalid Steam short profile URL provided.');
		}

		return inst;
	}

	public static renderToFormat(input: string, format: Exclude<Format, Format.AccountId>): string;
	public static renderToFormat(input: string, format: Format.AccountId): number;
	public static renderToFormat(input: string, format: Format): string | number {
		const inst = new this(input);
		switch (format) {
			case Format.SteamId:
				return inst.toSteamId2();
			case Format.SteamId3:
				return inst.toSteamId3();
			case Format.SteamId64:
				return inst.toSteamId64();
			case Format.FiveM:
				return inst.toFiveM();
			case Format.AccountId:
				return inst.accountId;
			case Format.InviteCode:
				return inst.toInviteCode();
			case Format.ShortUrl:
				return inst.toShortUrl();
			case Format.CsFriendCode:
				return inst.toCsFriendCode();
			default:
				throw new Error('Unsupported SteamID output format.');
		}
	}
}
