"use client";

import { useState, useEffect } from "react";
import { Text, Box, Group } from "@mantine/core";

export function LastUpdated() {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Group gap={8}>
      <Text size="xs" c="dark.3">
        {time && `Updated ${time}`}
      </Text>
      <Box
        w={8}
        h={8}
        style={{
          borderRadius: "50%",
          background: "var(--mantine-color-teal-6)",
          animation: "pulse 2s infinite",
        }}
      />
    </Group>
  );
}
