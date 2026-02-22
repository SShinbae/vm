import { Input } from "@/components/ui/Input";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { GroupService } from "@/lib/services/groupService";
import { useToast } from "@/hooks/useToast";
import { GroupFormData } from "@/types";
import { router, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import React, { useState } from "react";

export default function CreateGroupScreen() {
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const posthog = usePostHog();
  const navigation = useRouter();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/groups");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError("Please enter a group name");
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
      showError(error);
    } else {
      posthog?.capture("group_created");
      showSuccess("Group created successfully!");
      handleGoBack();
    }
  };

  const validateName = (value: string) => {
    if (!value.trim()) return "Group name is required";
    if (value.trim().length < 2)
      return "Group name must be at least 2 characters";
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
        onCancel={handleGoBack}
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
    </>
  );
}
