#! /bin/bash

# Update the borg explorer archive with the releases in the current directory.
# Process: Download releases from github to the directory with this script, then run it.


## Configuration

# Load environment variables from .env file.
set -o allexport
source .env
set +o allexport

# Expected environment variables:
# The destination repository (possibly located over ssh)
#REPOSITORY=""

# The passphrase for the repository (optional)
#BORG_PASSPHRASE=""

# The remote path for borg (optional)
#REMOTE_PATH="/usr/local/bin/borg"


## Checks

# Run borg info to check if the repository is accessible. Check the return code.
echo "Checking repository..."
borg info $REPOSITORY --remote-path $REMOTE_PATH > /dev/null

if [ $? -ne 0 ]; then
    echo "Repository not accessible. Aborting."
    echo "Check the repository path ($REPOSITORY) and the passphrase."
    exit 1
fi

# Check if completed directory exists. If it doesn't, create it.
if [ ! -d completed ]; then
    mkdir completed
fi

# Create folder for current run in completed directory.
completed_dir=$(date +%Y-%m-%d_%H-%M-%S)
mkdir completed/$completed_dir


## Update


# Check if the current directory contains any zip files.
if [ -z "$(ls *.zip)" ]; then
    echo "No zip files found. Nothing to update."
else
    # For each zip file in the current directory...
    for file in *.zip; do
        # Check if the filename matches the expected format.
        # Expected format: Borg.Explorer-darwin-x64-1.2.3.zip
        # We should extract the platform (darwin|linux), architecture (x64|arm64) and version (1.2.3).
        # We should also support future versions with unknown platforms and architectures.
        if [[ $file =~ ^Borg\.Explorer-(.+)-(.+)-(.+)\.zip$ ]]; then
            echo "Processing $file..."
            platform=${BASH_REMATCH[1]}
            architecture=${BASH_REMATCH[2]}
            version=${BASH_REMATCH[3]}

            # Archive names are of the format: platform-architecture-version
            archive_name="$platform-$architecture-$version"

            # Depending on the platform, we need to pick an example file to use for the creation timestamp.
            if [ $platform = "darwin" ]; then
                timestamp_file_path="Borg Explorer.app"
            elif [ $platform = "linux" ]; then
                timestamp_file_path="Borg Explorer-linux-x64/Borg Explorer"
            else
                echo "Unknown platform $platform. Skipping."
                continue
            fi

            # Check if the archive name already exists in the archive
            # If it does, we skip it.
            echo "  Checking if archive $archive_name already exists..."
            if borg list $REPOSITORY --remote-path $REMOTE_PATH | grep -q $archive_name; then
                echo "Archive $archive_name already exists. Skipping."
                mv $file completed/$completed_dir
                continue
            fi

            # Create a temporary directory to extract the zip file.
            tmpdir=$(mktemp -d)

            # Extract the zip file to the temporary directory.
            echo "  Extracting $file to $tmpdir..."
            unzip -q $file -d $tmpdir

            if [ $? -ne 0 ]; then
                echo "Error extracting $file. Skipping."
                continue
            fi

            # Temporarily move to the temporary directory.
            pushd $tmpdir > /dev/null

            # Create a new archive with the version as the name.
            echo "  Creating archive $archive_name..."
            borg create --progress --compression zstd --remote-path $REMOTE_PATH $REPOSITORY::$archive_name ./* --timestamp "$timestamp_file_path" > /dev/null

            borg_exit_code=$?

            # Move back to the original directory.
            popd > /dev/null

            # Delete the temporary directory.
            rm -rf $tmpdir

            if [ $borg_exit_code -ne 0 ]; then
                echo "Error creating archive $archive_name. Skipping."
                continue
            fi

            # Move the zip file to the completed directory.
            mv $file completed/$completed_dir
        else
            echo "Filename $file does not match the expected format. Skipping."
        fi

        # Testing: Only process the first file.
        #break
    done
fi

# Show the list of archives in the repository.
borg info $REPOSITORY --remote-path $REMOTE_PATH
echo ""
borg list $REPOSITORY --remote-path $REMOTE_PATH