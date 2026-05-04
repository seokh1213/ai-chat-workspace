# trip-plan Kubernetes Infra

This directory is intended to be synced by ArgoCD after the Tailscale Kubernetes Operator is installed in the cluster.

## Prerequisites

- A default Kubernetes `StorageClass`.
- Tailscale Kubernetes Operator installed outside this app sync.
- Tailnet MagicDNS and HTTPS enabled.
- A `tailscale` `IngressClass` in the cluster:

```bash
kubectl get ingressclass tailscale
```

The Tailscale operator setup needs OAuth credentials and tailnet policy tags. Keep that installation separate from this app unless you intentionally want this repository to own cluster-wide Tailscale resources.

## Images

Build and push these images to the internal registry before syncing:

```bash
docker buildx build --platform linux/amd64 -t registry.wukong.monster/dev/trip-plan/app:0.1.0 --push .
```

Build and push the Codex app-server image:

```bash
docker buildx build --platform linux/amd64 -f Dockerfile.codex -t registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0 --push .
```

`registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0` must be able to run:

```bash
codex app-server --listen ws://0.0.0.0:8765
```

## Secrets

Before syncing, replace `CHANGE_ME_BEFORE_ARGOCD_SYNC` in `secret.yaml` with an internal password or manage the Secret with your preferred secret manager.

## Local Docker Codex Auth Path

For local Docker simulation, use the host path:

```text
${HOME}/ai-chat/.codex
```

Mount it into the Codex container and set:

```text
HOME=/ai-chat
CODEX_HOME=/ai-chat/.codex
```

Example local simulation:

```bash
mkdir -p "$HOME/ai-chat/.codex"
docker run --rm -it \
  --name trip-plan-codex \
  -p 127.0.0.1:8765:8765 \
  -v "$HOME/ai-chat/.codex:/ai-chat/.codex" \
  registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0
```

If the image was built from `Dockerfile.codex`, it includes `ca-certificates`. Without CA certificates, `codex login` device auth can fail while requesting the OpenAI device code.

For local Docker login, run:

```bash
docker exec -it trip-plan-codex codex login
docker restart trip-plan-codex
docker exec -it trip-plan-codex codex login status
```

Restart after login is important. If `codex app-server` started before `auth.json` existed, it can keep running without upstream auth and chat requests may fail with `401 Unauthorized: Missing bearer or basic authentication`.

## Kubernetes Codex Login

In Kubernetes, Codex uses its own PVC mounted at `/ai-chat/.codex`, separate from the host user's existing Codex auth directory.

After the Codex Pod is running, authenticate once:

```bash
kubectl exec -it -n trip-plan deploy/trip-plan-codex -- codex login
kubectl rollout restart -n trip-plan deploy/trip-plan-codex
kubectl rollout status -n trip-plan deploy/trip-plan-codex
kubectl exec -it -n trip-plan deploy/trip-plan-codex -- codex login status
```

The login state persists on the `trip-plan-codex-home` PVC across Pod restarts. Do not mount the host `.codex` directory unless you explicitly accept host token sharing and node pinning.

The app-server `/healthz` endpoint only proves that the process is alive. It does not prove the upstream OpenAI auth token is accepted. After every first login or credential rotation, send one short chat message through the Trip Plan UI as the final acceptance check.

## Access

Only `trip-plan-app` is exposed to the tailnet through Tailscale Ingress:

```bash
kubectl get ingress -n trip-plan trip-plan
```

Expected URL:

```text
https://trip-plan.<tailnet>.ts.net
```

PostgreSQL and Codex app-server are `ClusterIP` services and are not exposed directly to the tailnet or the public internet.
