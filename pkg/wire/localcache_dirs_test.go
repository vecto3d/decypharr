package wire

import (
	"testing"

	"github.com/sirrobot01/decypharr/internal/config"
)

// The instant trigger is handed the *download* folder. When CacheDirs points at
// the media library, caching the download folder copies the file from the debrid
// provider a second time and consumes disk without changing what the media
// server reads — the library symlink still points at the rclone mount.
func TestWithinCacheDirs(t *testing.T) {
	cases := []struct {
		name      string
		cacheDirs []string
		dir       string
		want      bool
	}{
		// No CacheDirs configured -> legacy behaviour, everything qualifies.
		{"unset allows download folder", nil, "/data/downloads/radarr/Some.Movie", true},
		{"empty allows anything", []string{}, "/anywhere", true},

		// Configured -> only the library is cached.
		{"library dir itself", []string{"/data/media/movies"}, "/data/media/movies", true},
		{"movie folder inside library", []string{"/data/media/movies"}, "/data/media/movies/Dune (2021)", true},
		{"download folder excluded", []string{"/data/media/movies"}, "/data/downloads/radarr/Dune", false},
		{"second configured dir", []string{"/data/media/movies", "/data/media/tv"}, "/data/media/tv/Show/S01", true},

		// Prefix must respect path boundaries, not raw string prefixes.
		{"sibling with shared prefix excluded", []string{"/data/media/movies"}, "/data/media/movies-4k/Dune", false},

		// Trailing slashes and unclean paths must not change the decision.
		{"trailing slash on root", []string{"/data/media/movies/"}, "/data/media/movies/Dune", true},
		{"unclean dir", []string{"/data/media/movies"}, "/data/media/movies/./Dune", true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := &LocalCacheWorker{cfg: config.LocalCache{CacheDirs: tc.cacheDirs}}
			if got := w.withinCacheDirs(tc.dir); got != tc.want {
				t.Fatalf("withinCacheDirs(%q) with CacheDirs=%v = %v, want %v",
					tc.dir, tc.cacheDirs, got, tc.want)
			}
		})
	}
}
