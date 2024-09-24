# PR Review Notification

PR 리뷰 요청을 받으면 Discord로 알리는 Github Actions

```yml
name: PR Review Notification

on:
  pull_request:
    types: [review_requested]

jobs:
  runs-on: ubuntu-latest
  steps:
    - name: PR Review Notification
      uses: oris-8/notification-pr-review@v0.1.0
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        webhook_url: ${{ secrets.WEBHOOK_URL }}
        user_table: ${{secrets.USER_TABLE}}
```
