import z from "zod";

export const createApplicationValidator = z.object({
  companyName: z.string("Company Name is required !"),
  jobTitle: z.string("jobTitle is required !"),
  workLocation: z.enum(["remote", "on-site", "hybrid"], {
    error: (issue) => {
      return issue.input === undefined
        ? "workLocation is required"
        : "workLocation must be remote, on-site, or hybrid";
    },
  }),
  salary: z
    .string({
      error: (issue) => {
        return issue.input === undefined
          ? "salary is required !"
          : "Invalid Salary !";
      },
    })
    .optional(),
  jobURL: z
    .url("jobURL Must be URL Not normal string")
    .min(1, "jobURL is required"),
  source: z.string("source is required"),
  current_status: z.enum(
    ["Applied", "Interviewing", "Rejected", "Considering"],
    {
      error: (issue) => {
        return issue.input === undefined
          ? "application status is required !"
          : "application status must be Applied, Interviewing , Considering or Rejected";
      },
    },
  ),
  date: z.coerce
    .date("Date Field must be send as IOS string")
    .min(1, "Date Field is required"),
  notes: z.string("Notes Must Be String").optional(),
  contactLink: z.string("Contact link must be a string").optional(),
});

export const updateApplicationValidator = createApplicationValidator
  .partial()
  .extend({
    notes: z.preprocess(
      (value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      },
      z
        .array(
          z.object({
            text: z.string(),
            _id: z.string(),
          }),
        )
        .optional(),
    ),
  });
