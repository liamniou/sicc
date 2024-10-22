import re

# Open the compose.yaml file and read its content
with open("compose.yaml", "r") as file:
    content = file.read()

# Define a regex pattern to get the current version
pattern = r'image: liamnou/sicc:(.+)'

# Use regex to get the current version
current_version = re.search(pattern, content).group(1)

# Split the version string by '.'
version_parts = current_version.split('.')

# Increment the second part (minor version)
version_parts[1] = str(int(version_parts[1]) + 1)

# Join the parts back together to get the new version
new_version = ".".join(version_parts)

# Replace the old version with the new version in the compose.yaml file content
new_content = re.sub(pattern, f"image: liamnou/sicc:{new_version}", content)

# Save the new content to the file
with open("compose.yaml", "w") as file:
    file.write(new_content)

print(f"NEW_VERSION={new_version}")