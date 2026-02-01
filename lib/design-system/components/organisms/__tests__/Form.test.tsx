import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderWithProviders as render } from "@/__tests__/setup/testUtils";
import React from "react";
import { Form } from "../Form";
import type { FormField } from "../Form/Form.types";

describe("Form", () => {
  const basicFields: FormField[] = [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ];

  describe("Basic Rendering", () => {
    it("should render form fields", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} />);
      expect(screen.getByText("First Name")).toBeTruthy();
      expect(screen.getByText("Email")).toBeTruthy();
    });

    it("should render submit button", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} />);
      expect(screen.getByText("Submit")).toBeTruthy();
    });

    it("should render custom submit label", () => {
      render(
        <Form fields={basicFields} onSubmit={jest.fn()} submitLabel="Save" />,
      );
      expect(screen.getByText("Save")).toBeTruthy();
    });

    it("should render cancel button when showCancel and onCancel are provided", () => {
      render(
        <Form
          fields={basicFields}
          onSubmit={jest.fn()}
          showCancel
          onCancel={jest.fn()}
        />,
      );
      expect(screen.getByText("Cancel")).toBeTruthy();
    });

    it("should not render cancel button by default", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} />);
      const cancelButtons = screen.queryAllByText("Cancel");
      expect(cancelButtons.length).toBe(0);
    });
  });

  describe("Field Types", () => {
    it("should render text input fields", () => {
      const fields: FormField[] = [
        { name: "name", label: "Name", type: "text" },
      ];
      render(<Form fields={fields} onSubmit={jest.fn()} />);
      const input = screen.getByLabelText("Name");
      expect(input).toBeTruthy();
    });

    it("should render email input fields with email keyboard", () => {
      const fields: FormField[] = [
        { name: "email", label: "Email", type: "email" },
      ];
      render(<Form fields={fields} onSubmit={jest.fn()} />);
      const input = screen.getByLabelText("Email");
      expect(input.props.keyboardType).toBe("email-address");
    });

    it("should render password input fields with secure text entry", () => {
      const fields: FormField[] = [
        { name: "password", label: "Password", type: "password" },
      ];
      render(<Form fields={fields} onSubmit={jest.fn()} />);
      const input = screen.getByLabelText("Password");
      expect(input.props.secureTextEntry).toBe(true);
    });

    it("should render number input fields with numeric keyboard", () => {
      const fields: FormField[] = [
        { name: "age", label: "Age", type: "number" },
      ];
      render(<Form fields={fields} onSubmit={jest.fn()} />);
      const input = screen.getByLabelText("Age");
      expect(input.props.keyboardType).toBe("numeric");
    });

    it("should render textarea input fields with multiline", () => {
      const fields: FormField[] = [
        { name: "description", label: "Description", type: "textarea" },
      ];
      render(<Form fields={fields} onSubmit={jest.fn()} />);
      const input = screen.getByLabelText("Description");
      expect(input.props.multiline).toBe(true);
    });
  });

  describe("Form Values", () => {
    it("should display initial values", () => {
      const initialValues = { firstName: "John", email: "john@example.com" };
      render(
        <Form
          fields={basicFields}
          onSubmit={jest.fn()}
          initialValues={initialValues}
        />,
      );
      const firstNameInput = screen.getByLabelText("First Name");
      const emailInput = screen.getByLabelText("Email");
      expect(firstNameInput.props.value).toBe("John");
      expect(emailInput.props.value).toBe("john@example.com");
    });

    it("should update field value when text changes", async () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} />);
      const firstNameInput = screen.getByLabelText("First Name");
      fireEvent.changeText(firstNameInput, "Jane");
      await waitFor(() => {
        expect(screen.getByLabelText("First Name").props.value).toBe("Jane");
      });
    });
  });

  describe("Form Validation", () => {
    it("should show error for required field when empty on submit", async () => {
      const onSubmit = jest.fn();
      render(<Form fields={basicFields} onSubmit={onSubmit} />);
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(screen.getByText("First Name is required")).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should validate minimum length", async () => {
      const fields: FormField[] = [
        {
          name: "password",
          label: "Password",
          type: "password",
          validation: {
            min: 8,
            message: "Password must be at least 8 characters",
          },
        },
      ];
      const onSubmit = jest.fn();
      render(
        <Form
          fields={fields}
          onSubmit={onSubmit}
          initialValues={{ password: "123" }}
        />,
      );
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 8 characters"),
        ).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should validate maximum length", async () => {
      const fields: FormField[] = [
        {
          name: "username",
          label: "Username",
          type: "text",
          validation: {
            max: 10,
            message: "Username must not exceed 10 characters",
          },
        },
      ];
      const onSubmit = jest.fn();
      render(
        <Form
          fields={fields}
          onSubmit={onSubmit}
          initialValues={{ username: "12345678901" }}
        />,
      );
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(
          screen.getByText("Username must not exceed 10 characters"),
        ).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should validate pattern", async () => {
      const fields: FormField[] = [
        {
          name: "phone",
          label: "Phone",
          type: "text",
          validation: {
            pattern: /^\d{10}$/,
            message: "Phone must be 10 digits",
          },
        },
      ];
      const onSubmit = jest.fn();
      render(
        <Form
          fields={fields}
          onSubmit={onSubmit}
          initialValues={{ phone: "123" }}
        />,
      );
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(screen.getByText("Phone must be 10 digits")).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    it("should call onSubmit with form values when valid", async () => {
      const onSubmit = jest.fn();
      const initialValues = { firstName: "John", email: "john@example.com" };
      render(
        <Form
          fields={basicFields}
          onSubmit={onSubmit}
          initialValues={initialValues}
        />,
      );
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(initialValues);
      });
    });

    it("should not call onSubmit when form is invalid", async () => {
      const onSubmit = jest.fn();
      render(<Form fields={basicFields} onSubmit={onSubmit} />);
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);
      await waitFor(() => {
        expect(screen.getByText("First Name is required")).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should call onCancel when cancel button is pressed", () => {
      const onCancel = jest.fn();
      render(
        <Form
          fields={basicFields}
          onSubmit={jest.fn()}
          showCancel
          onCancel={onCancel}
        />,
      );
      const cancelButton = screen.getByText("Cancel");
      fireEvent.press(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading State", () => {
    it("should show loading state on submit button when loading", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} loading />);
      const submitButton = screen.getByText("Submit");
      expect(submitButton).toBeTruthy();
    });

    it("should keep inputs enabled when loading", () => {
      // Note: Form component only disables inputs when disabled prop is true
      // Loading prop only affects the submit button, not inputs
      render(<Form fields={basicFields} onSubmit={jest.fn()} loading />);
      const firstNameInput = screen.getByLabelText("First Name");
      expect(firstNameInput.props.editable).toBe(true);
    });
  });

  describe("Disabled State", () => {
    it("should disable all fields when disabled", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} disabled />);
      const firstNameInput = screen.getByLabelText("First Name");
      expect(firstNameInput.props.editable).toBe(false);
    });

    it("should still render submit button when disabled", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} disabled />);
      const submitButton = screen.getByText("Submit");
      expect(submitButton).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible input fields", () => {
      render(<Form fields={basicFields} onSubmit={jest.fn()} />);
      expect(screen.getByLabelText("First Name")).toBeTruthy();
      expect(screen.getByLabelText("Email")).toBeTruthy();
    });
  });
});
