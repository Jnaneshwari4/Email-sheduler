import Papa from "papaparse";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CsvParseResult = {
  validEmails: string[];
  invalidEmails: string[];
};

export function parseEmailCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const rawValues = result.data.flat().map((value) => String(value ?? "").trim());

        const uniqueEmails = Array.from(new Set(rawValues.filter(Boolean).map((v) => v.toLowerCase())));

        const validEmails: string[] = [];
        const invalidEmails: string[] = [];

        for (const email of uniqueEmails) {
          if (EMAIL_REGEX.test(email)) {
            validEmails.push(email);
          } else {
            invalidEmails.push(email);
          }
        }

        resolve({
          validEmails,
          invalidEmails
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
