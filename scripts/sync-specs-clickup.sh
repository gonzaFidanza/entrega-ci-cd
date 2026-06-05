#!/usr/bin/env bash
# Sincroniza specs/*.md hacia ClickUp (una vía: repo => board).
# El repo es la única fuente de verdad. Cada .md con frontmatter:
#   ---
#   id: SPEC-001
#   title: ...
#   status: draft|in-progress|done|blocked
#   priority: low|medium|high
#   ---
# se materializa como una task de ClickUp, identificada por el custom
# field "Spec ID". Si ya existe, se actualiza; si no, se crea.
#
# Requiere: curl, jq, yq (mikefarah). Todos vienen preinstalados en
# ubuntu-latest de GitHub Actions.
#
# Variables de entorno:
#   CLICKUP_TOKEN    Personal token (empieza con pk_...)
#   CLICKUP_LIST_ID  ID numérico de la lista destino
#   SPEC_FIELD_NAME  Opcional, default "Spec ID"

set -euo pipefail

: "${CLICKUP_TOKEN:?Falta CLICKUP_TOKEN}"
: "${CLICKUP_LIST_ID:?Falta CLICKUP_LIST_ID}"

API="https://api.clickup.com/api/v2"
SPEC_FIELD_NAME="${SPEC_FIELD_NAME:-Spec ID}"

map_status() {
  case "$1" in
    draft)       echo "to do" ;;
    in-progress) echo "in progress" ;;
    done)        echo "complete" ;;
    blocked)     echo "blocked" ;;
    *)           echo "to do" ;;
  esac
}

map_priority() {
  case "$1" in
    high)   echo 2 ;;
    medium) echo 3 ;;
    low)    echo 4 ;;
    *)      echo 3 ;;
  esac
}

echo "→ Obteniendo custom fields de la lista $CLICKUP_LIST_ID"
fields_json=$(curl -sS -H "Authorization: $CLICKUP_TOKEN" \
  "$API/list/$CLICKUP_LIST_ID/field")

spec_field_id=$(echo "$fields_json" \
  | jq -r --arg n "$SPEC_FIELD_NAME" '.fields[]? | select(.name==$n) | .id')

if [ -z "$spec_field_id" ] || [ "$spec_field_id" = "null" ]; then
  echo "ERROR: no se encontró el custom field \"$SPEC_FIELD_NAME\" en la lista."
  echo "Creálo en ClickUp como tipo 'Short text' y volvé a correr."
  exit 1
fi
echo "  custom field id: $spec_field_id"

echo "→ Obteniendo tasks existentes"
tasks_json=$(curl -sS -H "Authorization: $CLICKUP_TOKEN" \
  "$API/list/$CLICKUP_LIST_ID/task?include_closed=true&subtasks=false&page=0")

shopt -s nullglob
processed=0
for spec_file in specs/*.md; do
  echo ""
  echo "── $spec_file"

  # Frontmatter: contenido entre los dos primeros ---
  fm=$(awk '/^---$/{c++; if(c==2)exit; next} c==1' "$spec_file")
  if [ -z "$fm" ]; then
    echo "  (sin frontmatter, salto)"
    continue
  fi

  spec_id=$(printf '%s' "$fm" | yq '.id // ""')
  title=$(printf '%s' "$fm"   | yq '.title // ""')
  status=$(printf '%s' "$fm"  | yq '.status // "draft"')
  priority=$(printf '%s' "$fm" | yq '.priority // "medium"')

  if [ -z "$spec_id" ] || [ "$spec_id" = "null" ]; then
    echo "  ERROR: falta 'id' en frontmatter, salto."
    continue
  fi

  # Body: todo lo que viene después del segundo ---
  body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2' "$spec_file")
  cu_status=$(map_status "$status")
  cu_priority=$(map_priority "$priority")

  echo "  id=$spec_id  status=$status→$cu_status  prio=$priority→$cu_priority"

  task_id=$(echo "$tasks_json" | jq -r \
    --arg fid "$spec_field_id" --arg sid "$spec_id" '
      .tasks[]? | select(
        (.custom_fields // [])[]? |
        (.id == $fid) and ((.value // "") | tostring == $sid)
      ) | .id
    ' | head -n1)

  if [ -z "$task_id" ]; then
    echo "  → creando task nueva"
    payload=$(jq -n \
      --arg name "$title" \
      --arg desc "$body" \
      --arg status "$cu_status" \
      --argjson prio "$cu_priority" \
      --arg sfid "$spec_field_id" \
      --arg sid "$spec_id" \
      '{
        name: $name,
        markdown_description: $desc,
        status: $status,
        priority: $prio,
        custom_fields: [{ id: $sfid, value: $sid }]
      }')
    resp=$(curl -sS -X POST \
      -H "Authorization: $CLICKUP_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$payload" \
      "$API/list/$CLICKUP_LIST_ID/task")
    new_id=$(echo "$resp" | jq -r '.id // empty')
    if [ -z "$new_id" ]; then
      echo "  ERROR creando task: $resp"
      exit 1
    fi
    echo "  ✓ creada: $new_id"
  else
    echo "  → actualizando task $task_id"
    payload=$(jq -n \
      --arg name "$title" \
      --arg desc "$body" \
      --arg status "$cu_status" \
      --argjson prio "$cu_priority" \
      '{
        name: $name,
        markdown_description: $desc,
        status: $status,
        priority: $prio
      }')
    curl -sS -X PUT \
      -H "Authorization: $CLICKUP_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$payload" \
      "$API/task/$task_id" > /dev/null
    echo "  ✓ actualizada"
  fi
  processed=$((processed + 1))
done

echo ""
echo "Sync completo. Specs procesadas: $processed"
