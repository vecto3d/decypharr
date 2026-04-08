"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SolarLayers, SolarUserPlus, SolarArrowRight } from "@/components/Icons";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      notifications.show({ message: "Fill in all fields", color: "yellow" });
      return;
    }
    if (password !== confirmPassword) {
      notifications.show({ message: "Passwords don't match", color: "red" });
      return;
    }
    setLoading(true);
    try {
      await api.register(username, password);
      notifications.show({ message: "Account created", color: "green" });
      router.push("/");
    } catch (e) {
      notifications.show({ message: `Registration failed: ${e}`, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await api.skipAuth();
      router.push("/");
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    } finally {
      setSkipping(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--mantine-color-dark-9)",
      }}
    >
      <Paper
        p={32}
        w={400}
        style={{
          background: "var(--mantine-color-dark-8)",
          border: "1px solid var(--mantine-color-dark-6)",
        }}
      >
        <Group gap={10} mb={24} justify="center">
          <Box style={{ width: 44, height: 44, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-teal-6)" }}>
            <SolarLayers size={24} />
          </Box>
          <Box>
            <Text size="lg" fw={700} c="dark.0">Setup</Text>
            <Text size="xs" c="dimmed">Create an admin account</Text>
          </Box>
        </Group>

        <form onSubmit={handleSubmit}>
          <TextInput
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            size="sm"
            mb={12}
          />
          <PasswordInput
            label="Password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            size="sm"
            mb={12}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            size="sm"
            mb={20}
          />
          <Button
            type="submit"
            fullWidth
            color="teal"
            loading={loading}
            leftSection={<SolarUserPlus size={16} />}
          >
            Create Account
          </Button>
        </form>

        <Divider my={16} color="dark.6" label="or" labelPosition="center" />

        <Button
          fullWidth
          variant="subtle"
          color="gray"
          loading={skipping}
          rightSection={<SolarArrowRight size={16} />}
          onClick={handleSkip}
        >
          Skip Authentication
        </Button>
      </Paper>
    </Box>
  );
}
