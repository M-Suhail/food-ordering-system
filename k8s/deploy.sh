#!/bin/bash

# Food Ordering System - Kubernetes Quick Deployment Script
# This script automates the deployment of all services to Kubernetes

set -e

NAMESPACE="food-ordering"
REGISTRY="${1:-ghcr.io/your-org/food-ordering-system}"

echo "=========================================="
echo "Food Ordering System - Kubernetes Deploy"
echo "=========================================="
echo "Namespace: $NAMESPACE"
echo "Registry: $REGISTRY"
echo ""

# Step 1: Create namespace and RBAC
echo "[1/7] Creating namespace and RBAC..."
kubectl apply -f k8s/manifests/namespace.yaml
kubectl apply -f k8s/manifests/rbac.yaml
kubectl config set-context --current --namespace=$NAMESPACE

# Step 2: Deploy infrastructure
echo "[2/7] Deploying infrastructure (PostgreSQL, MongoDB, RabbitMQ)..."
kubectl apply -f k8s/manifests/databases/postgres.yaml
kubectl apply -f k8s/manifests/databases/mongodb.yaml
kubectl apply -f k8s/manifests/infrastructure/rabbitmq.yaml
kubectl apply -f k8s/manifests/infrastructure/otel-collector.yaml

echo "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n $NAMESPACE || true
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=300s -n $NAMESPACE || true
kubectl wait --for=condition=ready pod -l app=rabbitmq --timeout=300s -n $NAMESPACE || true

# Step 3: Create configs and secrets
echo "[3/7] Creating ConfigMaps and Secrets..."
kubectl apply -f k8s/manifests/configmaps.yaml
kubectl apply -f k8s/manifests/secrets.yaml
kubectl apply -f k8s/manifests/auth-config.yaml
kubectl apply -f k8s/manifests/auth-secrets.yaml
kubectl apply -f k8s/manifests/order-config.yaml
kubectl apply -f k8s/manifests/order-secrets.yaml
kubectl apply -f k8s/manifests/all-services-config.yaml

# Step 4: Deploy services with Helm
echo "[4/7] Deploying services with Helm..."

SERVICES=(
  "api-gateway:3000"
  "auth:3001"
  "order:3002"
  "restaurant:3003"
  "kitchen:3004"
  "payment:3005"
  "delivery:3006"
  "notification:3007"
)

for service in "${SERVICES[@]}"; do
  IFS=':' read -r service_name port <<< "$service"
  echo "  Deploying $service_name..."
  helm upgrade --install $service_name k8s/charts/$service_name \
    --namespace $NAMESPACE \
    --set image.repository="$REGISTRY/$service_name" \
    --set image.tag="latest" \
    --values k8s/charts/$service_name/values.yaml \
    --wait
done

# Step 5: Set up Ingress
echo "[5/7] Configuring Ingress..."
kubectl apply -f k8s/manifests/ingress.yaml

# Step 6: Verify deployments
echo "[6/7] Verifying deployments..."
echo ""
echo "Deployments:"
kubectl get deployments -n $NAMESPACE

echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE

echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE

# Step 7: Print access information
echo ""
echo "[7/7] Deployment complete!"
echo ""
echo "=========================================="
echo "Access Information:"
echo "=========================================="
echo ""
echo "API Gateway:"
echo "  kubectl port-forward svc/api-gateway 3000:80 -n $NAMESPACE"
echo "  curl http://localhost:3000/health"
echo ""
echo "RabbitMQ Management:"
echo "  kubectl port-forward svc/rabbitmq 15672:15672 -n $NAMESPACE"
echo "  http://localhost:15672 (guest/guest)"
echo ""
echo "PostgreSQL:"
echo "  kubectl port-forward svc/postgres 5432:5432 -n $NAMESPACE"
echo ""
echo "MongoDB:"
echo "  kubectl port-forward svc/mongodb 27017:27017 -n $NAMESPACE"
echo ""
echo "OpenTelemetry Collector:"
echo "  kubectl port-forward svc/otel-collector 4318:4318 -n $NAMESPACE"
echo ""
echo "View logs:"
echo "  kubectl logs -f deployment/api-gateway -n $NAMESPACE"
echo ""
echo "Watch pods:"
echo "  kubectl get pods -n $NAMESPACE -w"
echo ""
