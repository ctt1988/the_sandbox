# Look at commit history (type “q” to exit)
git log

# Make your local branch go back to a certain commit
git reset --hard <some_commit>

# Make your local branch become identical to a remote branch
git reset --hard <remote>/<branch_name>

# Create a new local branch that will be identical to remote branch
git checkout -b <my_new_branch> <remote>/<branch_name>

# Force a push to a remote branch and replace it
git push origin <your_branch_name> -f

# See all local branches
git branch

# Go to another branch
git checkout <your_branch_name>

# Create a new branch and go to it
git checkout -b <new_branch_name>

# Delete a local branch
git branch -d <branch_name>

# Delete all local branches except specified
git branch | grep -v “<branch_name>” | xargs git branch -D 