// List of supported email domains

export const DOMAINS = [
	{
		owner: "Centi",
		domain: "omailg.com",
	},
] satisfies {
	owner: string;
	domain: string;
}[];

export const DOMAINS_SET = new Set(DOMAINS.map((d) => d.domain));
