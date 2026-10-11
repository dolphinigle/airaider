| model | valid JSON | fields within word cap | median latency | list-price cost, all items |
|---|---|---|---|---|
| gpt | 72/72 | 90/97 | 6.5 s | $0.231 |
| haiku | 72/72 | 89/97 | 19.3 s | $0.975 |
| sonnet | 72/72 | 74/97 | 5.8 s | $0.932 |

| kind | gpt p50 | haiku p50 | sonnet p50 |
|---|---|---|---|
| card_finale | 4.6 s | 16.8 s | 4.6 s |
| card_first | 6.3 s | 17.4 s | 9.6 s |
| card_later | 5.3 s | 11.9 s | 4.6 s |
| plan | 57.1 s | 42.3 s | 29.6 s |
| rep_fail | 7.0 s | 20.1 s | 4.9 s |
| rep_finale | 6.2 s | 20.4 s | 5.9 s |
| rep_moved | 6.5 s | 21.4 s | 5.4 s |
