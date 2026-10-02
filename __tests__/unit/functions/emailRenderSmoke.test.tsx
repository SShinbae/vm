import { renderToStaticMarkup } from "react-dom/server";
import { toPlainText } from "@react-email/render";
import { Html, Text } from "@react-email/components";

describe("react-email under jest", () => {
  it("renders html and plain text", () => {
    const html = renderToStaticMarkup(
      <Html>
        <Text>Hello &amp; welcome</Text>
      </Html>,
    );

    expect(html).toContain("<html");
    expect(html).toContain("Hello &amp; welcome");
    expect(toPlainText(html).trim()).toBe("Hello & welcome");
  });
});
