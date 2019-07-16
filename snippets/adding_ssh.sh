# Create a new ssh key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Add your ssh key to ssh agent (so you don't have to type a password everytime)
eval "$(ssh-agent -s)"

# then
ssh-add

# enter your passcode one more time