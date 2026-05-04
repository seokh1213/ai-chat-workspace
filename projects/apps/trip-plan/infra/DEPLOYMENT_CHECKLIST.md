# Trip Plan Deployment Checklist

Use this checklist in order. Do not sync the app in ArgoCD until the Tailscale Operator and container images are ready.

## 1. Prepare Tailscale Operator

- [ ] Enable MagicDNS in the tailnet.
- [ ] Enable HTTPS certificates in the tailnet.
- [ ] Add tailnet policy tags for the operator and managed k8s services.
- [ ] Create a Tailscale OAuth client for the Kubernetes Operator.
- [ ] Install the Tailscale Kubernetes Operator on the cluster.
- [ ] Confirm the operator created the `tailscale` namespace.
- [ ] Confirm the `tailscale` IngressClass exists:

```bash
kubectl get ingressclass tailscale
```

## 2. Prepare Container Images

- [ ] Build the app image:

```bash
docker buildx build --platform linux/amd64 -t registry.wukong.monster/dev/trip-plan/app:0.1.0 --push .
```

- [ ] Push the app image:

```bash
docker buildx imagetools inspect registry.wukong.monster/dev/trip-plan/app:0.1.0
```

- [ ] Build or prepare a Codex app-server image at:

```bash
docker buildx build --platform linux/amd64 -f Dockerfile.codex -t registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0 --push .
```

- [ ] Confirm the Codex image includes CA certificates. Device auth can fail without them.

```bash
docker run --rm registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0 \
  ls -l /etc/ssl/certs/ca-certificates.crt
```

- [ ] Push the Codex app-server image:

```bash
docker buildx imagetools inspect registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0
```

- [ ] Confirm the Codex image can run:

```bash
docker run --rm -p 127.0.0.1:8765:8765 registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0
curl -fsS http://127.0.0.1:8765/healthz
```

- [ ] For local Docker simulation, mount auth at `~/ai-chat/.codex`:

```bash
mkdir -p "$HOME/ai-chat/.codex"
docker run --rm -d \
  --name trip-plan-codex \
  -p 127.0.0.1:8765:8765 \
  -v "$HOME/ai-chat/.codex:/ai-chat/.codex" \
  registry.wukong.monster/dev/trip-plan/codex-app-server:0.1.0
docker exec -it trip-plan-codex codex login
docker restart trip-plan-codex
docker exec -it trip-plan-codex codex login status
```

## 3. Prepare Secrets

- [ ] Replace `CHANGE_ME_BEFORE_ARGOCD_SYNC` in `infra/secret.yaml`.
- [ ] If the internal registry requires auth, create or reference an `imagePullSecret`.
- [ ] Keep Codex auth out of Kubernetes Secret for now; it will be created by manual `codex login` into the PVC mounted at `/ai-chat/.codex`.

## 4. Sync With ArgoCD

- [ ] Point the ArgoCD Application at `infra/`.
- [ ] Sync the namespace, Secret, PostgreSQL, Codex, app, NetworkPolicy, and Tailscale Ingress.
- [ ] Confirm workloads are created:

```bash
kubectl get pods,svc,pvc,ingress -n trip-plan
```

- [ ] Confirm no NodePort or LoadBalancer service was created:

```bash
kubectl get svc -n trip-plan
```

## 5. Authenticate Codex

- [ ] Wait until the Codex Pod exists.
- [ ] Run manual login inside the Pod:

```bash
kubectl exec -it -n trip-plan deploy/trip-plan-codex -- codex login
```

- [ ] Restart the Codex Deployment so app-server reloads the newly created auth file:

```bash
kubectl rollout restart -n trip-plan deploy/trip-plan-codex
kubectl rollout status -n trip-plan deploy/trip-plan-codex
```

- [ ] Confirm the login persists through the `trip-plan-codex-home` PVC:

```bash
kubectl exec -it -n trip-plan deploy/trip-plan-codex -- codex login status
```

- [ ] Send one short chat message through the UI. `/healthz` does not validate upstream OpenAI authentication.

## 6. Verify Tailnet-Only Access

- [ ] Confirm the Tailscale Ingress reports a tailnet hostname:

```bash
kubectl get ingress -n trip-plan trip-plan
```

- [ ] Open the expected URL from a tailnet device:

```text
https://trip-plan.<tailnet>.ts.net
```

- [ ] Confirm the app loads.
- [ ] Confirm workspace/trip creation writes to PostgreSQL.
- [ ] Confirm chat can reach Codex app-server.
- [ ] Confirm the app is not reachable from non-tailnet networks.

## 7. Operational Follow-Ups

- [ ] Move `infra/secret.yaml` to a real secret-management flow before production use.
- [ ] Decide the final internal registry host and replace `registry.internal` placeholders if needed.
- [ ] Add backup/restore for the PostgreSQL PVC.
- [ ] Add backup/restore notes for the Codex auth PVC.
- [ ] Consider switching PostgreSQL from in-cluster StatefulSet to a managed/internal DB if this becomes important data.
- [ ] Consider adding resource tuning after observing memory and CPU usage.
