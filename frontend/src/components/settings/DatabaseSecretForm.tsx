import { useCallback, useEffect, useState } from 'react';
import { Database, Eye, EyeOff, Loader2, PlugZap, Save, Trash2 } from 'lucide-react';
import {
  deleteSecret,
  listSecrets,
  storeSecret,
  testSecret,
  type ConnectionTestResult,
  type MaskedSecret,
} from '@/api/secretsApi';
import { ApiError } from '@/api/client';
import { cn } from '@/utils/format';

export function DatabaseSecretForm() {
  const [secrets, setSecrets] = useState<MaskedSecret[]>([]);
  const [name, setName] = useState('PostgreSQL Principal');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ConnectionTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const databaseSecret = secrets.find((item) => item.provider === 'database');

  const loadSecrets = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await listSecrets();
      setSecrets(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha ao carregar secrets.';
      setError(message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadSecrets();
  }, [loadSecrets]);

  async function handleTestDraft() {
    if (!secret.trim()) {
      setError('Informe a connection string do banco.');
      return;
    }

    setTesting(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await testSecret({
        provider: 'database',
        secret: secret.trim(),
      });
      setFeedback(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha no teste de conexão.';
      setError(message);
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!secret.trim()) {
      setError('Informe a connection string do banco.');
      return;
    }

    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const saved = await storeSecret({
        provider: 'database',
        name: name.trim() || 'PostgreSQL Principal',
        secret: secret.trim(),
      });
      setSecret('');
      setShowSecret(false);
      setFeedback({
        success: true,
        provider: 'database',
        message: `Secret salvo com criptografia AES-256-GCM (${saved.maskedSecret})`,
      });
      await loadSecrets();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha ao salvar secret.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSaved(id: string) {
    setTestingId(id);
    setError(null);
    setFeedback(null);

    try {
      const result = await testSecret({ id });
      setFeedback(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha no teste de conexão.';
      setError(message);
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      await deleteSecret(id);
      setFeedback({
        success: true,
        provider: 'database',
        message: 'Secret removido com sucesso.',
      });
      await loadSecrets();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha ao remover secret.';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold text-text">API Keys · Banco de Dados</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Cadastre a connection string do PostgreSQL. O frontend envia o valor; o backend
          criptografa com AES-256-GCM e nunca devolve o secret completo.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-card-elevated p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-accent/10 text-blue-accent">
            <Database className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[13px] font-medium text-text">PostgreSQL</p>
            <p className="text-[11px] text-muted">DATABASE_URL · provider: database</p>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-[12px] text-muted">Nome</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[13px] text-text outline-none transition-colors focus:border-blue-accent/40"
            placeholder="PostgreSQL Principal"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[12px] text-muted">Connection string</span>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-line bg-card px-3 py-2 pr-10 font-mono text-[12px] text-text outline-none transition-colors focus:border-blue-accent/40"
              placeholder="postgresql://user:password@host:5432/database"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:text-text"
              aria-label={showSecret ? 'Ocultar connection string' : 'Mostrar connection string'}
              onClick={() => setShowSecret((value) => !value)}
            >
              {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleTestDraft()}
            disabled={testing || !secret.trim()}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-muted transition-all hover:border-blue-accent/30 hover:text-text disabled:opacity-50"
          >
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
            Testar conexão
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !secret.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-accent/15 px-3 py-2 text-[13px] font-medium text-blue-accent transition-all hover:bg-blue-accent/25 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Salvar criptografado
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-[13px] font-medium text-text">Secrets cadastrados</h3>
        {loadingList ? (
          <p className="text-[13px] text-muted">Carregando...</p>
        ) : databaseSecret ? (
          <div className="rounded-xl border border-line bg-card-elevated px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-text">{databaseSecret.name}</p>
                <p className="mt-0.5 font-mono text-[12px] text-muted">{databaseSecret.maskedSecret}</p>
                <p className="mt-1 text-[11px] text-muted">
                  Atualizado em {new Date(databaseSecret.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleTestSaved(databaseSecret.id)}
                  disabled={testingId === databaseSecret.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted transition-all hover:border-blue-accent/30 hover:text-text disabled:opacity-50"
                >
                  {testingId === databaseSecret.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <PlugZap className="size-3.5" />
                  )}
                  Testar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(databaseSecret.id)}
                  disabled={deletingId === databaseSecret.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted transition-all hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === databaseSecret.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Remover
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted">Nenhuma connection string cadastrada ainda.</p>
        )}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[13px] text-red-400">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-[13px]',
            feedback.success
              ? 'border-blue-accent/30 bg-blue-accent/5 text-blue-accent'
              : 'border-orange-accent/30 bg-orange-accent/5 text-orange-accent',
          )}
        >
          {feedback.message}
          {feedback.database ? ` · ${feedback.database}` : null}
          {feedback.version ? ` · ${feedback.version}` : null}
          {feedback.latencyMs !== undefined ? ` · ${feedback.latencyMs}ms` : null}
        </p>
      ) : null}
    </div>
  );
}
