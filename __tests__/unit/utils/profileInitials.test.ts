import { profileInitials } from "@/lib/utils/profileInitials";

it("uses the first and last words of a full name", () => {
  expect(profileInitials("Wan Ahnaf")).toBe("WA");
  expect(profileInitials("Wan Muhammad Ahnaf")).toBe("WA");
});

it("handles a single name and an absent name", () => {
  expect(profileInitials("Wan")).toBe("WA");
  expect(profileInitials(" ")).toBe("?");
});
