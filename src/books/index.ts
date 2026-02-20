import type { Book } from "../types.ts";
import atkinsInorganic from "./atkins-inorganic.ts";
import atkinsPchem from "./atkins-pchem.ts";
import jonesOrganic from "./jones-organic.ts";
import qm from "./qm.ts";
import sunakawa from "./sunakawa-emag.ts";
import thermoStat from "./thermo-stat.ts";
import vollhardOrganic from "./vollhardt-organic.ts";
import warrenOrganic from "./warren-organic.ts";

const books: Book[] = [
	sunakawa,
	qm,
	thermoStat,
	jonesOrganic,
	vollhardOrganic,
	warrenOrganic,
	atkinsInorganic,
	atkinsPchem,
];

export default books;
