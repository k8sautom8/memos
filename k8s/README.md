# Kubernetes Deployment Guide for Memos

This directory contains Kubernetes manifests for deploying Memos in a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.19+)
- `kubectl` configured to access your cluster
- Storage class configured (for PersistentVolumeClaim)
- Ingress controller installed (optional, for external access)

## Quick Start

1. **Create namespace**:
   ```bash
   kubectl apply -f namespace.yaml
   ```

2. **Create ConfigMap** (customize `config.json` if needed):
   ```bash
   kubectl apply -f configmap.yaml
   ```

3. **Create Secret** (only if using MySQL/PostgreSQL):
   ```bash
   # Edit secret.yaml with your database credentials
   kubectl apply -f secret.yaml
   ```

4. **Create PersistentVolumeClaim**:
   ```bash
   kubectl apply -f pvc.yaml
   ```

5. **Deploy Memos**:
   ```bash
   # Edit deployment.yaml and update:
   # - MEMOS_INSTANCE_URL
   # - OLLAMA_BASE_URL (if using Ollama)
   # - Database configuration (if not using SQLite)
   kubectl apply -f deployment.yaml
   ```

6. **Create Service**:
   ```bash
   kubectl apply -f service.yaml
   ```

7. **Create Ingress** (optional, for external access):
   ```bash
   # Edit ingress.yaml and update:
   # - Domain name
   # - Ingress class
   # - TLS configuration
   kubectl apply -f ingress.yaml
   ```

## Configuration

### Environment Variables

Edit `deployment.yaml` to customize environment variables:

- **MEMOS_MODE**: `prod`, `dev`, or `demo` (default: `prod`)
- **MEMOS_PORT**: HTTP port (default: `5230`)
- **MEMOS_INSTANCE_URL**: Public URL of your instance (required for OAuth)
- **OLLAMA_BASE_URL**: Ollama API URL (if using AI features)
- **OLLAMA_MODEL**: Default Ollama model

### Database Configuration

#### SQLite (Default)

No additional configuration needed. Data is stored in the PersistentVolumeClaim.

#### MySQL

1. Deploy MySQL (or use existing MySQL service)
2. Update `deployment.yaml`:
   ```yaml
   - name: MEMOS_DRIVER
     value: "mysql"
   - name: MEMOS_DSN
     value: "memos:$(DB_PASSWORD)@tcp(mysql-service:3306)/memos"
   ```
3. Create secret with database credentials:
   ```bash
   kubectl create secret generic memos-db-secret \
     --from-literal=username=memos \
     --from-literal=password=your-password \
     --from-literal=database=memos \
     -n memos
   ```

#### PostgreSQL

1. Deploy PostgreSQL (or use existing PostgreSQL service)
2. Update `deployment.yaml`:
   ```yaml
   - name: MEMOS_DRIVER
     value: "postgres"
   - name: MEMOS_DSN
     value: "postgres://memos:$(DB_PASSWORD)@postgres-service:5432/memos?sslmode=disable"
   ```
3. Create secret with database credentials:
   ```bash
   kubectl create secret generic memos-db-secret \
     --from-literal=username=memos \
     --from-literal=password=your-password \
     --from-literal=database=memos \
     -n memos
   ```

### ConfigMap for Templates and AI Prompts

Edit `configmap.yaml` to customize:
- Templates (with `{{DATE}}` placeholder support)
- AI prompts (tag generation, writing assistant, etc.)

After updating the ConfigMap:
```bash
kubectl apply -f configmap.yaml
kubectl rollout restart deployment/memos -n memos
```

## Scaling

To scale Memos horizontally:

```bash
kubectl scale deployment memos --replicas=3 -n memos
```

**Note**: If using SQLite, only one replica should be used. For multiple replicas, use MySQL or PostgreSQL.

## Updating

### Update Image

```bash
kubectl set image deployment/memos memos=neosmemo/memos:latest -n memos
kubectl rollout status deployment/memos -n memos
```

### Update Configuration

1. Edit `configmap.yaml` or `deployment.yaml`
2. Apply changes:
   ```bash
   kubectl apply -f configmap.yaml
   kubectl apply -f deployment.yaml
   ```
3. Restart deployment:
   ```bash
   kubectl rollout restart deployment/memos -n memos
   ```

## Monitoring

### Check Pod Status

```bash
kubectl get pods -n memos
kubectl logs -f deployment/memos -n memos
```

### Check Service

```bash
kubectl get svc -n memos
```

### Check Ingress

```bash
kubectl get ingress -n memos
```

## Troubleshooting

### Pod Not Starting

1. Check pod logs:
   ```bash
   kubectl logs -f deployment/memos -n memos
   ```

2. Check pod events:
   ```bash
   kubectl describe pod -l app=memos -n memos
   ```

3. Verify PVC is bound:
   ```bash
   kubectl get pvc -n memos
   ```

### Cannot Access Service

1. Check service endpoints:
   ```bash
   kubectl get endpoints -n memos
   ```

2. Port-forward for testing:
   ```bash
   kubectl port-forward svc/memos 5230:80 -n memos
   ```

3. Check ingress:
   ```bash
   kubectl describe ingress memos -n memos
   ```

### Configuration Not Loading

1. Verify ConfigMap:
   ```bash
   kubectl get configmap memos-config -n memos -o yaml
   ```

2. Check volume mount:
   ```bash
   kubectl exec -it deployment/memos -n memos -- ls -la /var/opt/memos/
   ```

3. Restart deployment:
   ```bash
   kubectl rollout restart deployment/memos -n memos
   ```

## Backup and Restore

### Backup Data

```bash
# Create backup of PVC
kubectl exec -it deployment/memos -n memos -- tar czf /tmp/memos-backup.tar.gz /var/opt/memos
kubectl cp memos/<pod-name>:/tmp/memos-backup.tar.gz ./memos-backup.tar.gz
```

### Restore Data

```bash
# Copy backup to pod
kubectl cp ./memos-backup.tar.gz memos/<pod-name>:/tmp/memos-backup.tar.gz
# Extract backup
kubectl exec -it deployment/memos -n memos -- tar xzf /tmp/memos-backup.tar.gz -C /
```

## Cleanup

To remove all resources:

```bash
kubectl delete -f ingress.yaml
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete -f pvc.yaml
kubectl delete -f configmap.yaml
kubectl delete -f secret.yaml
kubectl delete -f namespace.yaml
```

**Warning**: Deleting the PVC will delete all data. Make sure to backup before cleanup.

## Additional Resources

- [Configuration Guide](../docs/CONFIGURATION_GUIDE.md)
- [Configuration Reference](../docs/CONFIGURATION.md)
- [Features Guide](../docs/FEATURES.md)
