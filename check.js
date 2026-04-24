const searchDigits = "99";
const regexPattern = searchDigits.split('').join('[\\s\\-()]*');
console.log(regexPattern);
try {
  new RegExp(regexPattern);
  console.log("SUCCESS");
} catch(e) {
  console.error("ERROR", e.message);
}
