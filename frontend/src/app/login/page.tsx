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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SolarLayers, SolarLogin } from "@/components/Icons";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      notifications.show({ message: "Enter username and password", color: "yellow" });
      return;
    }
    setLoading(true);
    try {
      await api.login(username, password);
      router.push("/");
    } catch {
      notifications.show({ message: "Invalid credentials", color: "red" });
    } finally {
      setLoading(false);
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
            <Text size="lg" fw={700} c="dark.0">Decypharr</Text>
            <Text size="xs" c="dimmed">Sign in to continue</Text>
          </Box>
        </Group>

        <form onSubmit={handleSubmit}>
          <TextInput
            label="Username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            size="sm"
            mb={12}
          />
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            size="sm"
            mb={20}
          />
          <Button
            type="submit"
            fullWidth
            color="teal"
            loading={loading}
            leftSection={<SolarLogin size={16} />}
          >
            Sign In
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
