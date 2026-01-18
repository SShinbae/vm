import { IconSymbol } from "@/components/ui/icon-symbol";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

type SectionType = "privacy" | "terms";

export default function PrivacyScreen() {
  const { theme } = useStyles();
  const [activeSection, setActiveSection] = useState<SectionType>("privacy");

  const SectionTab = ({
    section,
    label,
  }: {
    section: SectionType;
    label: string;
  }) => {
    const isActive = activeSection === section;
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: isActive ? theme.colors.primary : "transparent",
          alignItems: "center",
        }}
        onPress={() => setActiveSection(section)}
        accessibilityRole="tab"
        accessibilityLabel={`${label} tab`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={{
            color: isActive ? theme.colors.white : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: isActive
              ? theme.fontWeight.semibold
              : theme.fontWeight.normal,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const SectionCard = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View
      style={{
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        marginTop: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        marginHorizontal: theme.spacing.lg,
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text
      style={{
        fontSize: theme.fontSize.base,
        color: theme.colors.textSecondary,
        lineHeight: theme.fontSize.base * 1.6,
        marginBottom: theme.spacing.md,
      }}
    >
      {children}
    </Text>
  );

  const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{
        flexDirection: "row",
        marginBottom: theme.spacing.sm,
        paddingLeft: theme.spacing.sm,
      }}
    >
      <Text
        style={{
          color: theme.colors.primary,
          marginRight: theme.spacing.sm,
          fontSize: theme.fontSize.base,
        }}
      >
        •
      </Text>
      <Text
        style={{
          flex: 1,
          fontSize: theme.fontSize.base,
          color: theme.colors.textSecondary,
          lineHeight: theme.fontSize.base * 1.5,
        }}
      >
        {children}
      </Text>
    </View>
  );

  const renderPrivacyPolicy = () => (
    <>
      <SectionCard title="Overview">
        <Paragraph>
          This Privacy Policy describes how Vehicles Management (&quot;we&quot;,
          &quot;our&quot;, or &quot;the app&quot;) collects, uses, and protects
          your information when you use our vehicle fleet management and expense
          tracking services.
        </Paragraph>
        <Paragraph>
          We are committed to protecting your privacy and ensuring the security
          of your personal and vehicle-related data. By using our app, you agree
          to the collection and use of information in accordance with this
          policy.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Information We Collect">
        <Paragraph>
          To provide our vehicle management services, we collect the following
          types of information:
        </Paragraph>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
            marginTop: theme.spacing.sm,
          }}
        >
          Account Information
        </Text>
        <BulletPoint>
          Email address for account creation and communication
        </BulletPoint>
        <BulletPoint>
          Username and display name for profile identification
        </BulletPoint>
        <BulletPoint>
          Profile picture (optional) to personalize your account
        </BulletPoint>

        <Text
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
            marginTop: theme.spacing.md,
          }}
        >
          Vehicle Information
        </Text>
        <BulletPoint>
          Vehicle details (make, model, year, license plate)
        </BulletPoint>
        <BulletPoint>Vehicle images you choose to upload</BulletPoint>
        <BulletPoint>Mileage and odometer readings you record</BulletPoint>
        <BulletPoint>Vehicle status and condition notes</BulletPoint>

        <Text
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
            marginTop: theme.spacing.md,
          }}
        >
          Activity & Expense Data
        </Text>
        <BulletPoint>
          Fuel purchase records (amount, cost, location)
        </BulletPoint>
        <BulletPoint>Service and maintenance logs</BulletPoint>
        <BulletPoint>
          Receipt images you upload for expense tracking
        </BulletPoint>
        <BulletPoint>Trip and mileage logs for business purposes</BulletPoint>
      </SectionCard>

      <SectionCard title="How We Use Your Information">
        <Paragraph>We use your information to:</Paragraph>
        <BulletPoint>
          Provide vehicle fleet management and tracking services
        </BulletPoint>
        <BulletPoint>
          Generate expense reports and analytics for your vehicles
        </BulletPoint>
        <BulletPoint>
          Calculate fuel consumption and maintenance schedules
        </BulletPoint>
        <BulletPoint>
          Enable vehicle sharing within groups you create or join
        </BulletPoint>
        <BulletPoint>
          Send notifications about vehicle maintenance reminders
        </BulletPoint>
        <BulletPoint>Improve and personalize your app experience</BulletPoint>
        <BulletPoint>
          Provide customer support when you need assistance
        </BulletPoint>
      </SectionCard>

      <SectionCard title="Data Storage & Security">
        <Paragraph>
          Your data is securely stored using industry-standard encryption and
          security measures. We implement appropriate technical and
          organizational safeguards to protect your information against
          unauthorized access, alteration, or destruction.
        </Paragraph>
        <BulletPoint>All data transmissions are encrypted</BulletPoint>
        <BulletPoint>Secure authentication protects your account</BulletPoint>
        <BulletPoint>
          Regular security audits ensure data protection
        </BulletPoint>
        <BulletPoint>Access controls limit who can view your data</BulletPoint>
      </SectionCard>

      <SectionCard title="Data Sharing">
        <Paragraph>
          We do not sell, trade, or rent your personal information to third
          parties. Your data may be shared only in the following circumstances:
        </Paragraph>
        <BulletPoint>
          With group members you invite to share vehicle access
        </BulletPoint>
        <BulletPoint>
          When required by law or to comply with legal processes
        </BulletPoint>
        <BulletPoint>
          To protect our rights, privacy, safety, or property
        </BulletPoint>
        <BulletPoint>
          With service providers who assist in operating our services (under
          strict confidentiality)
        </BulletPoint>
      </SectionCard>

      <SectionCard title="Your Rights">
        <Paragraph>You have the right to:</Paragraph>
        <BulletPoint>
          Access and view all your personal data stored in the app
        </BulletPoint>
        <BulletPoint>
          Update or correct your account information at any time
        </BulletPoint>
        <BulletPoint>Delete your account and all associated data</BulletPoint>
        <BulletPoint>Export your vehicle and expense data</BulletPoint>
        <BulletPoint>Opt out of non-essential notifications</BulletPoint>
        <BulletPoint>Withdraw from shared vehicle groups</BulletPoint>
      </SectionCard>

      <SectionCard title="Contact Us">
        <Paragraph>
          If you have questions about this Privacy Policy or how we handle your
          data, please contact us at:
        </Paragraph>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            color: theme.colors.primary,
            fontWeight: theme.fontWeight.medium,
          }}
        >
          ahnaf@wanahnaf.dev
        </Text>
      </SectionCard>

      <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          Last updated: January 2026
        </Text>
      </View>
    </>
  );

  const renderTermsConditions = () => (
    <>
      <SectionCard title="Agreement to Terms">
        <Paragraph>
          By accessing or using Vehicles Management (&quot;the app&quot;), you
          agree to be bound by these Terms and Conditions. If you do not agree
          with any part of these terms, you may not use the app.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Description of Service">
        <Paragraph>
          Vehicles Management provides a comprehensive vehicle fleet management
          platform that enables users to:
        </Paragraph>
        <BulletPoint>
          Track and manage multiple vehicles in a single dashboard
        </BulletPoint>
        <BulletPoint>
          Record fuel purchases and calculate consumption metrics
        </BulletPoint>
        <BulletPoint>Log mileage for business and personal trips</BulletPoint>
        <BulletPoint>Track maintenance and service history</BulletPoint>
        <BulletPoint>Store and organize expense receipts</BulletPoint>
        <BulletPoint>
          Generate reports and analytics for vehicle costs
        </BulletPoint>
        <BulletPoint>
          Share vehicle access with team members through groups
        </BulletPoint>
      </SectionCard>

      <SectionCard title="User Accounts">
        <Paragraph>
          To use the app, you must create an account. You agree to:
        </Paragraph>
        <BulletPoint>
          Provide accurate and complete registration information
        </BulletPoint>
        <BulletPoint>
          Maintain the security of your account credentials
        </BulletPoint>
        <BulletPoint>
          Notify us immediately of any unauthorized account access
        </BulletPoint>
        <BulletPoint>
          Be responsible for all activities under your account
        </BulletPoint>
        <Paragraph>
          You must be at least 18 years old or have parental consent to use this
          app.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Acceptable Use">
        <Paragraph>You agree not to:</Paragraph>
        <BulletPoint>Use the app for any unlawful purpose</BulletPoint>
        <BulletPoint>
          Upload false, misleading, or fraudulent information
        </BulletPoint>
        <BulletPoint>
          Attempt to gain unauthorized access to other accounts
        </BulletPoint>
        <BulletPoint>
          Interfere with or disrupt the app&apos;s services
        </BulletPoint>
        <BulletPoint>Share your account credentials with others</BulletPoint>
        <BulletPoint>
          Use the app to track vehicles without proper authorization
        </BulletPoint>
      </SectionCard>

      <SectionCard title="Vehicle & Data Ownership">
        <Paragraph>
          You retain ownership of all vehicle information and data you enter
          into the app. By using the app, you grant us a limited license to
          store, process, and display your data solely for the purpose of
          providing our services.
        </Paragraph>
        <Paragraph>
          You are responsible for ensuring you have the right to enter and
          manage information about any vehicles you add to the app.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Group Sharing">
        <Paragraph>When you create or join vehicle sharing groups:</Paragraph>
        <BulletPoint>
          Group members can view shared vehicle information
        </BulletPoint>
        <BulletPoint>
          Group admins can manage membership and permissions
        </BulletPoint>
        <BulletPoint>You can leave groups at any time</BulletPoint>
        <BulletPoint>
          Group owners can remove shared vehicles or members
        </BulletPoint>
        <Paragraph>
          You are responsible for managing who has access to your shared
          vehicles.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Service Availability">
        <Paragraph>
          We strive to maintain reliable service, but we do not guarantee
          uninterrupted access. The app may be temporarily unavailable due to:
        </Paragraph>
        <BulletPoint>Scheduled maintenance and updates</BulletPoint>
        <BulletPoint>Technical issues or server downtime</BulletPoint>
        <BulletPoint>Circumstances beyond our control</BulletPoint>
        <Paragraph>
          We are not liable for any losses resulting from service interruptions.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Limitation of Liability">
        <Paragraph>
          The app is provided &quot;as is&quot; without warranties of any kind.
          We are not liable for:
        </Paragraph>
        <BulletPoint>
          Accuracy of fuel consumption or expense calculations
        </BulletPoint>
        <BulletPoint>Decisions made based on app data or analytics</BulletPoint>
        <BulletPoint>Loss of data due to technical issues</BulletPoint>
        <BulletPoint>
          Any indirect, incidental, or consequential damages
        </BulletPoint>
        <Paragraph>
          You should maintain your own records and not rely solely on the app
          for critical business or legal documentation.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Termination">
        <Paragraph>
          We reserve the right to suspend or terminate your account if you
          violate these terms or engage in activities that harm other users or
          the service.
        </Paragraph>
        <Paragraph>
          You may delete your account at any time through the app settings. Upon
          deletion, your data will be permanently removed in accordance with our
          Privacy Policy.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Changes to Terms">
        <Paragraph>
          We may update these Terms and Conditions from time to time. We will
          notify you of significant changes through the app or via email.
          Continued use of the app after changes constitutes acceptance of the
          new terms.
        </Paragraph>
      </SectionCard>

      <SectionCard title="Contact">
        <Paragraph>
          For questions about these Terms and Conditions, please contact us at:
        </Paragraph>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            color: theme.colors.primary,
            fontWeight: theme.fontWeight.medium,
          }}
        >
          ahnaf@wanahnaf.dev
        </Text>
      </SectionCard>

      <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          Last updated: January 2026
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaxWidthContainer>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.background,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol
              name="chevron.left"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
              }}
            >
              Privacy & Terms
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.xs,
              }}
            >
              Your rights and our policies
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <SectionTab section="privacy" label="Privacy Policy" />
          <SectionTab section="terms" label="Terms & Conditions" />
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
        >
          {activeSection === "privacy" && renderPrivacyPolicy()}
          {activeSection === "terms" && renderTermsConditions()}
        </ScrollView>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
