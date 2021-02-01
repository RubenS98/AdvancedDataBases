# Use a lighter version of Node as a parent image
FROM node:latest
# Set the working directory to /api
WORKDIR /Backend
# copy package.json into the container at /api
COPY package*.json /Backend/
# install dependencies
RUN npm install
# Copy the current directory contents into the container at /api
COPY . /Backend/
# Make port 80 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["npm", "start"]