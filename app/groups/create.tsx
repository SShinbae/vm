import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { GroupService } from "@/lib/services/groupService";
import { GroupFormData } from "@/types";
import { router } from "expo-router";
import React, { useState } from "react";

export default function CreateGroupScreen() {
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMessage("Please enter a group name");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    const groupData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    const { error } = await GroupService.createGroup(groupData);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const validateName = (value: string) => {
    if (!value.trim()) return "Group name is required";
    if (value.trim().length < 2) return "Group name must be at least 2 characters";
    return undefined;
  };

  return (
    <>
      <FormLayout
        header={{
          title: "Create Group",
          showBack: true,
        }}
        title="Create Group"
        description="Create a new group to share vehicles and collaborate with family or team members"
        submitLabel="Create Group"
        cancelLabel="Cancel"
        onSubmit={handleSave}
        onCancel={() => router.back()}
        loading={loading}
      >
        <Input
          label="Group Name"
          value={formData.name}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, name: text }))
          }
          placeholder="Family, Work Team, etc."
          required
          error={formData.name ? validateName(formData.name) : undefined}
          helperText="Choose a name that identifies your group"
          leftIcon="people"
        />

        <Spacer size="md" />

        <Input
          label="Description (Optional)"
          value={formData.description || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, description: text }))
          }
          placeholder="Describe the purpose of this group..."
          multiline
          numberOfLines={3}
          helperText="Help members understand what this group is for"
        />
      </FormLayout>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Group created successfully!"
        variant="success"
        buttonText="Done"
      />

      <AlertModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        variant="error"
      />
    </>
  );
}
