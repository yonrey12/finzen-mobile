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

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
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
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-ink dark:text-white">
              Fin<Text className="text-accent">Zen</Text>
            </Text>
            <Text className="text-lg font-semibold text-ink dark:text-white">Crea tu cuenta</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Un correo y una contraseña, nada más.
            </Text>
          </View>

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
              autoComplete="new-password"
              secureTextEntry
              placeholder="••••••••"
              hint="Mínimo 6 caracteres."
            />

            {error ? (
              <View className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
                <Text className="text-sm text-danger">{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSignup}
              disabled={loading || !email || !password}
              className="mt-2 items-center rounded-full bg-accent px-4 py-3 active:bg-accent-hover disabled:opacity-50"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Crear cuenta</Text>
              )}
            </Pressable>
          </View>

          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="./" className="font-medium text-accent">
              Inicia sesión
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
