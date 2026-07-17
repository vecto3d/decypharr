package config

import (
	"encoding/json"
	"testing"
)

// Regression test: the frontend sends an `enabled` field for each Arr, but the
// backend Arr struct used to omit it, so it was silently dropped on save and
// came back undefined on reload (checkbox always reverted to unchecked).
func TestArrEnabledRoundTrips(t *testing.T) {
	true_, false_ := true, false

	cases := []struct {
		name string
		in   *bool
		want string // substring expected in marshaled JSON ("" = key absent)
	}{
		{"explicit true persists", &true_, `"enabled":true`},
		{"explicit false persists", &false_, `"enabled":false`},
		{"legacy nil omits the key", nil, ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			b, err := json.Marshal(Arr{Name: "radarr", Host: "http://radarr:7878", Token: "x", Enabled: tc.in})
			if err != nil {
				t.Fatalf("marshal: %v", err)
			}
			if tc.want == "" {
				if got := string(b); contains(got, `"enabled"`) {
					t.Fatalf("expected no enabled key for legacy nil, got %s", got)
				}
			} else if !contains(string(b), tc.want) {
				t.Fatalf("expected %s in %s", tc.want, string(b))
			}

			// And it must survive a full round-trip back into the struct.
			var out Arr
			if err := json.Unmarshal(b, &out); err != nil {
				t.Fatalf("unmarshal: %v", err)
			}
			if (tc.in == nil) != (out.Enabled == nil) {
				t.Fatalf("nil-ness changed: in=%v out=%v", tc.in, out.Enabled)
			}
			if tc.in != nil && *out.Enabled != *tc.in {
				t.Fatalf("value changed: in=%v out=%v", *tc.in, *out.Enabled)
			}
		})
	}
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
