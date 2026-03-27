const text = "hello";
const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\s])*$/g;
console.log(emojiRegex.test(text.trim()));
console.log(emojiRegex.test("".trim()));
