// Register all textbooks here.
// To add a new book, create a JS file in this directory following the same
// structure as sunakawa-emag.js, then import and add it to the array below.
import sunakawa from "./sunakawa-emag.js";
import qm from "./qm.js";
import thermoStat from "./thermo-stat.js";
import organicChem from "./organic-chem.js";
import jonesOrganic from "./jones-organic.js";
import warrenOrganic from "./warren-organic.js";

const books = [sunakawa, qm, thermoStat, organicChem, jonesOrganic, warrenOrganic];

export default books;
