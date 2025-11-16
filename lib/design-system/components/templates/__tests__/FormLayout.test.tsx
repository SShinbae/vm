import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "../../atoms/Text";
import { FormLayout } from "../FormLayout";

describe("FormLayout", () => {
  const defaultProps = {
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Single-Step Form", () => {
    it("should render form content", () => {
      render(
        <FormLayout {...defaultProps}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Form Fields")).toBeTruthy();
    });

    it("should render form title", () => {
      render(
        <FormLayout {...defaultProps} title="Create Account">
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Create Account")).toBeTruthy();
    });

    it("should render form description", () => {
      render(
        <FormLayout {...defaultProps} description="Fill out the form below">
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Fill out the form below")).toBeTruthy();
    });

    it("should render submit button", () => {
      render(
        <FormLayout {...defaultProps}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Submit")).toBeTruthy();
    });

    it("should render custom submit label", () => {
      render(
        <FormLayout {...defaultProps} submitLabel="Create">
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Create")).toBeTruthy();
    });

    it("should call onSubmit when submit is pressed", () => {
      const onSubmit = jest.fn();
      render(
        <FormLayout onSubmit={onSubmit}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("should render cancel button when onCancel provided", () => {
      const onCancel = jest.fn();
      render(
        <FormLayout {...defaultProps} onCancel={onCancel}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Cancel")).toBeTruthy();
    });

    it("should call onCancel when cancel is pressed", () => {
      const onCancel = jest.fn();
      render(
        <FormLayout {...defaultProps} onCancel={onCancel}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      const cancelButton = screen.getByText("Cancel");
      fireEvent.press(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multi-Step Form", () => {
    const steps = [
      { id: "step1", title: "Step 1", content: <Text>Step 1 Content</Text> },
      {
        id: "step2",
        title: "Step 2",
        content: <Text>Step 2 Content</Text>,
        optional: true,
      },
      { id: "step3", title: "Step 3", content: <Text>Step 3 Content</Text> },
    ];

    it("should show progress indicator", () => {
      render(<FormLayout {...defaultProps} steps={steps} />);
      expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    });

    it("should show first step content by default", () => {
      render(<FormLayout {...defaultProps} steps={steps} />);
      expect(screen.getByText("Step 1 Content")).toBeTruthy();
      expect(screen.queryByText("Step 2 Content")).toBeNull();
    });

    it("should show next button on first step", () => {
      render(<FormLayout {...defaultProps} steps={steps} />);
      expect(screen.getByText("Next")).toBeTruthy();
      expect(screen.queryByText("Previous")).toBeNull();
    });

    it("should navigate to next step", () => {
      render(<FormLayout {...defaultProps} steps={steps} />);
      const nextButton = screen.getByText("Next");
      fireEvent.press(nextButton);
      expect(screen.getByText("Step 2 Content")).toBeTruthy();
    });

    it("should show previous button on second step", () => {
      render(<FormLayout {...defaultProps} steps={steps} currentStep={1} />);
      expect(screen.getByText("Previous")).toBeTruthy();
      expect(screen.getByText("Next")).toBeTruthy();
    });

    it("should show submit button on last step", () => {
      render(<FormLayout {...defaultProps} steps={steps} currentStep={2} />);
      expect(screen.getByText("Submit")).toBeTruthy();
      expect(screen.queryByText("Next")).toBeNull();
    });

    it("should show optional indicator", () => {
      render(<FormLayout {...defaultProps} steps={steps} currentStep={1} />);
      expect(screen.getByText("Step 2 of 3 (Optional)")).toBeTruthy();
    });

    it("should call onStepChange when navigating", () => {
      const onStepChange = jest.fn();
      render(
        <FormLayout
          {...defaultProps}
          steps={steps}
          onStepChange={onStepChange}
        />,
      );
      const nextButton = screen.getByText("Next");
      fireEvent.press(nextButton);
      expect(onStepChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Error Display", () => {
    it("should show error summary", () => {
      const errors = {
        email: "Email is required",
        password: "Password must be at least 8 characters",
      };
      render(
        <FormLayout {...defaultProps} errors={errors}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      expect(screen.getByText("Please fix the following errors:")).toBeTruthy();
      expect(screen.getByText("• Email is required")).toBeTruthy();
      expect(
        screen.getByText("• Password must be at least 8 characters"),
      ).toBeTruthy();
    });
  });

  describe("Loading State", () => {
    it("should disable buttons when loading", () => {
      render(
        <FormLayout {...defaultProps} loading onCancel={jest.fn()}>
          <Text>Form Fields</Text>
        </FormLayout>,
      );
      const submitButton = screen.getByText("Submit");
      const cancelButton = screen.getByText("Cancel");
      expect(submitButton.props.accessibilityState).toEqual({ disabled: true });
      expect(cancelButton.props.accessibilityState).toEqual({ disabled: true });
    });
  });
});
