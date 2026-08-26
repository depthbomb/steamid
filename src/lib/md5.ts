const SHIFTS = [
	7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
	5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
	4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
	6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
] as const;

const CONSTANTS = Array.from({ length: 64 }, (_, index) =>
	Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000));

function rotateLeft(value: number, shift: number): number {
	return (value << shift) | (value >>> (32 - shift));
}

/** Returns the first little-endian word of MD5(accountId + "OGSC"). */
export function steamAccountHash(accountId: number): number {
	const words = new Uint32Array(16);
	words[0] = accountId;
	words[1] = 0x4353474F;
	words[2] = 0x80;
	words[14] = 64;

	let a = 0x67452301;
	let b = 0xEFCDAB89;
	let c = 0x98BADCFE;
	let d = 0x10325476;

	for (let index = 0; index < 64; index++) {
		let mixed: number;
		let wordIndex: number;

		if (index < 16) {
			mixed = (b & c) | (~b & d);
			wordIndex = index;
		} else if (index < 32) {
			mixed = (d & b) | (~d & c);
			wordIndex = (5 * index + 1) & 15;
		} else if (index < 48) {
			mixed = b ^ c ^ d;
			wordIndex = (3 * index + 5) & 15;
		} else {
			mixed = c ^ (b | ~d);
			wordIndex = (7 * index) & 15;
		}

		const previousD = d;
		d = c;
		c = b;
		b = (b + rotateLeft((a + mixed + CONSTANTS[index] + words[wordIndex]) | 0, SHIFTS[index])) | 0;
		a = previousD;
	}

	return (a + 0x67452301) >>> 0;
}
