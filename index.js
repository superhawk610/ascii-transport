// This encoding decreases overall artwork size by mapping each character to an integer and then storing
// the artwork in a bit array using the least possible number of bits for each character id. The character
// map and bit count for each character is stored in the header at the start of the returned bit array.
// The binary array has the format:
// [
//   first 8 bits: length of header (n)
//   next n bits: header (character map and bits per character)
//   remaining bits: encoded artwork
// ]
function Encode(art) {
  // if artwork is empty, no need to encode it
  if (!art) return [];

  // create character map from each character to unique numeric id
  const map = {};
  let id = 0;

  // iterate over artwork, adding new characters to the map
  for (let i = 0; i < art.length; i++) {
    const char = art[i];
    if (!map.hasOwnProperty(char)) {
      map[char] = id;
      id++;
    }
  }

  // generate header information from map
  // get smallest possible number of bits to represent each character id
  const bitsPerCharacter = maxBitsRequiredForInt(id - 1);
  // encode character map in binary
  const header = generateHeader(map, bitsPerCharacter);

  // convert character map to binary
  const binaryMap = {};
  Object.keys(map).forEach(key => {
    const charId = map[key];
    binaryMap[key] = intToBitArray(charId, bitsPerCharacter);
  });

  // encode artwork as binary array
  const artwork = [];
  for (let i = 0; i < art.length; i++) {
    const char = art[i];
    artwork.push(...binaryMap[char]);
  }

  return [...intToBitArray(header.length), ...header, ...artwork];
}

function Decode(encoded) {
  // determine header length
  const headerLength = bitArrayToInt(encoded.slice(0, 8));

  // extract header
  const header = encoded.slice(8, headerLength + 8);

  // parse header
  const bitsPerCharacter = bitArrayToInt(header.slice(0, 8));
  const headerCharacterMap = header.slice(8);
  const headerKeyValuePairLength = bitsPerCharacter + 8;
  const headerKeyValuePairCount =
    headerCharacterMap.length / headerKeyValuePairLength;
  const map = {};
  for (let i = 0; i < headerKeyValuePairCount; i++) {
    const startIndex = i * headerKeyValuePairLength;
    const keyValuePair = headerCharacterMap.slice(
      startIndex,
      startIndex + headerKeyValuePairLength
    );
    const charId = bitArrayToInt(keyValuePair.slice(0, bitsPerCharacter));
    const ascii = bitArrayToInt(keyValuePair.slice(bitsPerCharacter));
    const char = String.fromCharCode(ascii);
    map[charId] = char;
  }

  // parse artwork
  const artwork = encoded.slice(headerLength + 8);
  const artworkCharacterCount = artwork.length / bitsPerCharacter;
  let parsed = "";
  for (let i = 0; i < artworkCharacterCount; i++) {
    const startIndex = i * bitsPerCharacter;
    const id = bitArrayToInt(
      artwork.slice(startIndex, startIndex + bitsPerCharacter)
    );
    parsed += map[id];
  }

  return parsed;
}

const solution = art => {
  const encoded = Encode(art);
  const decoded = Decode(encoded);

  console.log(art);
  if (art === decoded) {
    const originalSize = art.length * 8;
    const encodedSize = encoded.length;
    const difference = originalSize - encodedSize;
    const reduction = ((difference / originalSize) * 100).toFixed(2);
    console.log("Encode / Decode successful!");
    console.log(`Original size:     ${originalSize} bits`);
    console.log(`Encoded size:      ${encodedSize} bits`);
    console.log(`Size saved:        ${difference} bits`);
    console.log(`Overall reduction: ${reduction}%`);
  } else {
    console.log("Encode failure :(");
  }
  console.log();
};

// Utility functions
// header format:
// [
//   first 8 bits: bits per character (n)
//   remaining bits are 8 + n bit pairs: [
//     first n bits: character id
//     remaining 8 bits: ASCII character
//   ]
// ]
function generateHeader(characterMap, maxBitsPerCharacter) {
  const header = [...intToBitArray(maxBitsPerCharacter)];
  Object.keys(characterMap).forEach(char => {
    const charId = intToBitArray(characterMap[char], maxBitsPerCharacter);
    const ascii = intToBitArray(char.charCodeAt(0));
    header.push(...charId, ...ascii);
  });
  return header;
}

function intToBitArray(int, width = 8) {
  const binaryString = int.toString(2);
  return binaryString
    .padStart(8, "0")
    .split("")
    .map(str => (str === "1" ? 1 : 0))
    .slice(-width);
}

function bitArrayToInt(bits) {
  return parseInt(bits.join(""), 2);
}

function maxBitsRequiredForInt(int) {
  switch (true) {
    case int > 128:
      return 8;
    case int > 64:
      return 7;
    case int > 32:
      return 6;
    case int > 16:
      return 5;
    case int > 8:
      return 4;
    case int > 4:
      return 3;
    case int > 2:
      return 2;
    default:
      return 1;
  }
}

// test cases
solution(`
         _.-.
       ,'/ //\\
      /// // /)
     /// // //|
    /// // ///
   /// // ///
  (\`: // ///
   \`;\`: ///
   / /:\`:/
  / /  \`'
 / /
(_/
`);

solution(`
 __         __
/  \\.-"""-./  \\
\\    -   -    /
 |   o   o   |
 \\  .-'''-.  /
  '-\\__Y__/-'
     \`---\`
`);

solution(`
         (
          )
     __..---..__
 ,-='  /  |  \  \`=-.
:--..___________..--;
 \.,_____________,./
`);
