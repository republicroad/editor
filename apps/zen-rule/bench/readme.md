
# bun 

## performance

```bash
hyperfine --warmup 30 --runs 200 'bun backend/bun/bench/test_zen.ts'  'python backend/bun/bench/test_zen.py'
```