import React from "react";
import { render } from "@testing-library/react-native";

import { CONTACT_EMAIL } from "@/components/landing/content";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal/documents";

jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

describe("LegalDocument", () => {
  it("renders the title, every section heading and the contact email", () => {
    const { getByText, getAllByText } = render(
      <LegalDocument doc={PRIVACY_POLICY} />,
    );

    expect(getByText("Privacy Policy")).toBeTruthy();
    PRIVACY_POLICY.sections.forEach((s) => {
      expect(getByText(s.heading)).toBeTruthy();
    });
    expect(getAllByText(CONTACT_EMAIL).length).toBeGreaterThan(0);
  });

  it("includes the Google Limited Use statement required for OAuth review", () => {
    const { getByText } = render(<LegalDocument doc={PRIVACY_POLICY} />);
    expect(getByText(/Limited Use requirements/)).toBeTruthy();
  });

  it("can hide the title for the tabbed in-app screen", () => {
    const { queryByText } = render(
      <LegalDocument doc={TERMS_OF_SERVICE} showTitle={false} />,
    );
    expect(queryByText("Terms of Service")).toBeNull();
  });
});
