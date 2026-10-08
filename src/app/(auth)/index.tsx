import { useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { TextField } from "@/components/text-field";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-ink"
    >
      <ScrollView
        contentContainerClassName="flex-1 items-center justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-sm gap-6 rounded-2xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-900">
          <Text className="text-center text-3xl font-bold text-ink dark:text-white">
            Fin<Text className="text-accent">Zen</Text>
          </Text>

          <View className="gap-4">
            <TextField
              label="Correo"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="tu@correo.com"
            />
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              secureTextEntry
              placeholder="••••••••"
            />

            {error ? (
              <View className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
                <Text className="text-sm text-danger">{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={loading || !email || !password}
              className="mt-2 items-center rounded-full bg-accent px-4 py-3 active:bg-accent-hover disabled:opacity-50"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Iniciar sesión</Text>
              )}
            </Pressable>
          </View>

          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="font-medium text-accent">
              Regístrate
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
